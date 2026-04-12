import db from '../models';
import { Op } from 'sequelize';
import { createNotificationService } from './notification';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfLocalDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const toISODateLocal = (d) => {
  // Use local day bucket, then format as YYYY-MM-DD in UTC string to keep stable date text
  const x = startOfLocalDay(d);
  return x.toISOString().slice(0, 10);
};

const KIND_BY_OFFSET_DAYS = {
  1: 'task_due_1d',
  5: 'task_due_5d',
  3: 'task_due_3d',
  7: 'task_due_7d',
};

const buildDueNotificationMessage = (title, offsetDays, dueISO) => {
  const label = offsetDays === 1 ? '1 ngày' : `${offsetDays} ngày`;
  return `Task "${title}" sắp hết hạn còn ${label} (vào ${dueISO})`;
};

const reminderAlreadyExists = async ({ userId, taskId, kind }) => {
  // payload là JSON string trong cột TEXT, ví dụ: {"type":"task","taskId":"...","kind":"task_due_1d",...}
  // Vì vậy không cần escape ngược dấu nháy như trong JS regex; chỉ cần match theo substring.
  // Chỉ cần taskId + kind là đủ để đảm bảo nhắc đúng 1 lần cho mỗi bucket.
  // Lưu ý: JSON.stringify giữ thứ tự key theo object, và payload tạo ở runTaskDueRemindersOnce đang có `{ type, kind, taskId, ... }`
  // nên "kind" sẽ xuất hiện trước "taskId" trong chuỗi JSON.
  const needle = `%\"kind\":\"${kind}\"%\"taskId\":\"${String(taskId)}\"%`;
  const existing = await db.Notification.findOne({
    where: {
      user_id: String(userId),
      payload: { [Op.like]: needle },
    },
    attributes: ['id'],
  });
  return !!existing;
};

export const runTaskDueRemindersOnce = async () => {
  const today = startOfLocalDay(new Date());
  const todayISO = toISODateLocal(today);

  const tasks = await db.Task.findAll({
    where: {
      assigned_to: { [Op.ne]: null },
      dueDate: { [Op.ne]: null },
      status: { [Op.ne]: 'Done' },
    },
    include: [
      {
        model: db.Project,
        as: 'project',
        attributes: ['id', 'workspace_id'],
        required: false,
      },
    ],
  });

  for (const task of tasks) {
    const assignedTo = task.assigned_to;
    if (!assignedTo) continue;
    const dueLocal = startOfLocalDay(task.dueDate);
    const diffDays = Math.round((dueLocal.getTime() - today.getTime()) / MS_PER_DAY);

    if (!KIND_BY_OFFSET_DAYS[diffDays]) continue;

    const kind = KIND_BY_OFFSET_DAYS[diffDays];
    const remindOnISO = todayISO;
    const taskIdStr = String(task.id);
    const projectIdStr = task.project?.id ? String(task.project.id) : null;
    const workspaceIdStr = task.project?.workspace_id ? String(task.project.workspace_id) : null;

    if (!projectIdStr || !workspaceIdStr) continue;

    const exists = await reminderAlreadyExists({
      userId: assignedTo,
      taskId: taskIdStr,
      kind,
    });
    if (exists) continue;

    const dueISO = toISODateLocal(dueLocal);
    const message = buildDueNotificationMessage(task.title, diffDays, dueISO);

    await createNotificationService(String(assignedTo), message, {
      type: 'task',
      kind,
      taskId: taskIdStr,
      projectId: projectIdStr,
      workspaceId: workspaceIdStr,
      remindOn: remindOnISO,
      dueISO,
    });
  }
};

export const startTaskDueRemindersScheduler = () => {
  let isRunning = false;

  const run = async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      await runTaskDueRemindersOnce();
    } catch (e) {
      console.error('Task due reminder job failed:', e?.message || e);
    } finally {
      isRunning = false;
    }
  };

  // Run immediately on server start
  run();

  // Then run hourly (enough precision for 1/3/7 day buckets)
  setInterval(run, 60 * 60 * 1000);
};

