import db from '../models';
import { v4 } from 'uuid';  

//CREATE TASK
export const createTaskService = (projectId, taskData) => new Promise(async (resolve, reject) => {
    try {
        const taskId = v4();
        // Handle assignees - if it's an array, take the first one (or you can create a separate Task_Assignees table for multiple assignees)
        const assignedTo = Array.isArray(taskData.assignees) && taskData.assignees.length > 0 
            ? taskData.assignees[0] 
            : taskData.assignees;
        
        const task = await db.Task.create({
            id: taskId,
            project_id: projectId,
            assigned_to: assignedTo,
            title: taskData.title,
            description: taskData.description,
            status: taskData.status,
            priority: taskData.priority || 'Medium',
            dueDate : taskData.dueDate,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        if(!task) {
            return resolve({
                err: 1,
                msg: 'FAILED TO CREATE TASK'
            });
        }

        resolve({
            err: 0,
            msg: 'OK',
            response: task,
            project: projectId
        });
    } catch (error) {
        resolve({
            err: 1,
            msg: 'FAILED TO CREATE TASK: ' + error.message
        });
    }
});

//GET TASK BY ID
export const getTaskByIdService = (taskId) => new Promise(async (resolve, reject) => {
    try {
        const task = await db.Task.findOne({
            where: { id: taskId },
            include: [
                {
                    model: db.Users,
                    as: 'assignedUser',
                    attributes: ['id', 'username', 'email']
                },
                {
                    model: db.Project,
                    as: 'project',
                    attributes: ['id', 'name', 'description']
                },
                {
                    model: db.Users,
                    as: 'watchers',
                    attributes: ['id', 'username', 'email'],
                    through: { attributes: [] }
                },
                {
                    model: db.Task_Activity,
                    as: 'activities',
                    include: [
                        {
                            model: db.Users,
                            as: 'user',
                            attributes: ['id', 'username', 'email']
                        }
                    ],
                    order: [['createdAt', 'DESC']]
                }
            ]
        });

        if(!task) {
            return resolve({
                err: 1,
                msg: 'TASK NOT FOUND'
            });
        }

        resolve({
            err: 0,
            msg: 'OK',
            response: task
        });
    } catch (error) {
        resolve({
            err: 1,
            msg: 'FAILED TO GET TASK: ' + error.message
        });
    }
});

//GET TASK ACTIVITIES
export const getTaskActivitiesService = (taskId) => new Promise(async (resolve, reject) => {
    try {
        // Convert taskId to number if it's a string (for BIGINT compatibility)
        const numericTaskId = typeof taskId === 'string' && !isNaN(taskId) ? parseInt(taskId, 10) : taskId;

        // Get activities with user information directly (no need to check task existence first)
        const activities = await db.Task_Activity.findAll({
            where: { task_id: numericTaskId },
            include: [
                {
                    model: db.Users,
                    as: 'user',
                    attributes: ['id', 'username', 'email'],
                    required: false
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: 50 // Limit to prevent loading too many activities
        });

        resolve({
            err: 0,
            msg: 'OK',
            response: activities || []
        });
    } catch (error) {
        console.error('Error getting task activities:', error);
        resolve({
            err: 1,
            msg: 'FAILED TO GET TASK ACTIVITIES: ' + error.message,
            response: []
        });
    }
});

//UPDATE TASK TITLE
export const updateTaskTitleService = (taskId, title, userId) => new Promise(async (resolve, reject) => {
    try {
        const task = await db.Task.findOne({
            where: { id: taskId }
        });

        if(!task) {
            return resolve({
                err: 1,
                msg: 'TASK NOT FOUND'
            });
        }

        await task.update({
            title: title,
            updatedAt: new Date()
        });

        // log activity
        try {
            const numericTaskId = typeof taskId === 'string' && !isNaN(taskId) ? parseInt(taskId, 10) : taskId;
            await db.Task_Activity.create({
                task_id: numericTaskId,
                user_id: userId,
                action: 'TITLE_UPDATED',
                payload: { title }
            });
            console.log('Activity created for TITLE_UPDATED:', { taskId: numericTaskId, userId });
        } catch (activityError) {
            console.error('Failed to create activity:', activityError);
            // Don't fail the whole operation if activity creation fails
        }

        await task.reload({
            include: [
                { model: db.Users, as: 'assignedUser', attributes: ['id','username','email'] },
                { model: db.Project, as: 'project', attributes: ['id','name','description'] },
                { model: db.Users, as: 'watchers', attributes: ['id','username','email'], through: { attributes: [] } },
                { model: db.Task_Activity, as: 'activities', include: [{ model: db.Users, as: 'user', attributes: ['id','username','email'] }], order: [['createdAt','DESC']] }
            ]
        });

        resolve({
            err: 0,
            msg: 'OK',
            response: task
        });
    } catch (error) {
        resolve({
            err: 1,
            msg: 'FAILED TO UPDATE TASK TITLE: ' + error.message
        });
    }
});

//UPDATE TASK STATUS
export const updateTaskStatusService = (taskId, status, userId) => new Promise(async (resolve, reject) => {
    try {
        const validStatuses = ['To Do', 'In Progress', 'Done'];
        
        if(!validStatuses.includes(status)) {
            return resolve({
                err: 1,
                msg: 'INVALID STATUS. Must be one of: To Do, In Progress, Done'
            });
        }

        const task = await db.Task.findOne({
            where: { id: taskId }
        });

        if(!task) {
            return resolve({
                err: 1,
                msg: 'TASK NOT FOUND'
            });
        }

        await task.update({
            status: status,
            updatedAt: new Date()
        });

        try {
            const numericTaskId = typeof taskId === 'string' && !isNaN(taskId) ? parseInt(taskId, 10) : taskId;
            await db.Task_Activity.create({
                task_id: numericTaskId,
                user_id: userId,
                action: 'STATUS_UPDATED',
                payload: { status }
            });
            console.log('Activity created for STATUS_UPDATED:', { taskId: numericTaskId, userId });
        } catch (activityError) {
            console.error('Failed to create activity:', activityError);
            // Don't fail the whole operation if activity creation fails
        }

        await task.reload({
            include: [
                { model: db.Users, as: 'assignedUser', attributes: ['id','username','email'] },
                { model: db.Project, as: 'project', attributes: ['id','name','description'] },
                { model: db.Users, as: 'watchers', attributes: ['id','username','email'], through: { attributes: [] } },
                { model: db.Task_Activity, as: 'activities', include: [{ model: db.Users, as: 'user', attributes: ['id','username','email'] }], order: [['createdAt','DESC']] }
            ]
        });

        resolve({
            err: 0,
            msg: 'OK',
            response: task
        });
    } catch (error) {
        resolve({
            err: 1,
            msg: 'FAILED TO UPDATE TASK STATUS: ' + error.message
        });
    }
});

//UPDATE TASK DESCRIPTION
export const updateTaskDescriptionService = (taskId, description, userId) => new Promise(async (resolve, reject) => {
    try {
        const task = await db.Task.findOne({
            where: { id: taskId }
        });

        if(!task) {
            return resolve({
                err: 1,
                msg: 'TASK NOT FOUND'
            });
        }

        await task.update({
            description: description || null,
            updatedAt: new Date()
        });

        try {
            const numericTaskId = typeof taskId === 'string' && !isNaN(taskId) ? parseInt(taskId, 10) : taskId;
            await db.Task_Activity.create({
                task_id: numericTaskId,
                user_id: userId,
                action: 'DESCRIPTION_UPDATED',
                payload: { description }
            });
            console.log('Activity created for DESCRIPTION_UPDATED:', { taskId: numericTaskId, userId });
        } catch (activityError) {
            console.error('Failed to create activity:', activityError);
            // Don't fail the whole operation if activity creation fails
        }

        await task.reload({
            include: [
                { model: db.Users, as: 'assignedUser', attributes: ['id','username','email'] },
                { model: db.Project, as: 'project', attributes: ['id','name','description'] },
                { model: db.Users, as: 'watchers', attributes: ['id','username','email'], through: { attributes: [] } },
                { model: db.Task_Activity, as: 'activities', include: [{ model: db.Users, as: 'user', attributes: ['id','username','email'] }], order: [['createdAt','DESC']] }
            ]
        });

        resolve({
            err: 0,
            msg: 'OK',
            response: task
        });
    } catch (error) {
        resolve({
            err: 1,
            msg: 'FAILED TO UPDATE TASK DESCRIPTION: ' + error.message
        });
    }
});

//UPDATE TASK ASSIGNEES
export const updateTaskAssigneesService = (taskId, assignees, userId) => new Promise(async (resolve, reject) => {
    try {
        const task = await db.Task.findOne({
            where: { id: taskId }
        });

        if(!task) {
            return resolve({
                err: 1,
                msg: 'TASK NOT FOUND'
            });
        }

        // Since assigned_to is a single STRING field, we'll use the first assignee
        // If assignees array is empty, set to null
        const assignedTo = Array.isArray(assignees) && assignees.length > 0 
            ? assignees[0] 
            : null;

        await task.update({
            assigned_to: assignedTo,
            updatedAt: new Date()
        });

        // Reload task with associations to get updated assignedUser
        await task.reload({
            include: [
                {
                    model: db.Users,
                    as: 'assignedUser',
                    attributes: ['id', 'username', 'email']
                },
                {
                    model: db.Project,
                    as: 'project',
                    attributes: ['id', 'name', 'description']
                },
                { model: db.Users, as: 'watchers', attributes: ['id','username','email'], through: { attributes: [] } },
                { model: db.Task_Activity, as: 'activities', include: [{ model: db.Users, as: 'user', attributes: ['id','username','email'] }], order: [['createdAt','DESC']] }
            ]
        });

        try {
            const numericTaskId = typeof taskId === 'string' && !isNaN(taskId) ? parseInt(taskId, 10) : taskId;
            await db.Task_Activity.create({
                task_id: numericTaskId,
                user_id: userId,
                action: 'ASSIGNEES_UPDATED',
                payload: { assignees }
            });
            console.log('Activity created for ASSIGNEES_UPDATED:', { taskId: numericTaskId, userId });
        } catch (activityError) {
            console.error('Failed to create activity:', activityError);
            // Don't fail the whole operation if activity creation fails
        }

        resolve({
            err: 0,
            msg: 'OK',
            response: task
        });
    } catch (error) {
        resolve({
            err: 1,
            msg: 'FAILED TO UPDATE TASK ASSIGNEES: ' + error.message
        });
    }
});

export const updateTaskPriorityService = (taskId, priority, userId) => new Promise(async (resolve, reject) => {
    try {
        const validPriorities = ['Low', 'Medium', 'High'];

        if (!validPriorities.includes(priority)) {
            return resolve({
                err: 1,
                msg: 'INVALID PRIORITY. Must be one of: Low, Medium, High'
            });
        }

        const task = await db.Task.findOne({
            where: { id: taskId }
        });

        if (!task) {
            return resolve({
                err: 1,
                msg: 'TASK NOT FOUND'
            });
        }

        await task.update({
            priority: priority,
            updatedAt: new Date()
        });

        // log activity
        try {
            const numericTaskId = typeof taskId === 'string' && !isNaN(taskId) ? parseInt(taskId, 10) : taskId;
            await db.Task_Activity.create({
                task_id: numericTaskId,
                user_id: userId,
                action: 'PRIORITY_UPDATED',
                payload: { priority }
            });
            console.log('Activity created for PRIORITY_UPDATED:', { taskId: numericTaskId, userId });
        } catch (activityError) {
            console.error('Failed to create activity:', activityError);
            // Don't fail the whole operation if activity creation fails
        }

        await task.reload({
            include: [
                { model: db.Users, as: 'assignedUser', attributes: ['id','username','email'] },
                { model: db.Project, as: 'project', attributes: ['id','name','description'] },
                { model: db.Users, as: 'watchers', attributes: ['id','username','email'], through: { attributes: [] } },
                { model: db.Task_Activity, as: 'activities', include: [{ model: db.Users, as: 'user', attributes: ['id','username','email'] }], order: [['createdAt','DESC']] }
            ]
        });

        resolve({
            err: 0,
            msg: 'OK',
            response: task
        });
    } catch (error) {
        resolve({
            err: 1,
            msg: 'FAILED TO UPDATE TASK PRIORITY: ' + error.message
        });
    }
});

//WATCH/UNWATCH TASK
export const watchTaskService = (taskId, userId) => new Promise(async (resolve, reject) => {
    try {
        if (!userId) {
            return resolve({
                err: 1,
                msg: 'USER ID IS REQUIRED'
            });
        }

        const task = await db.Task.findOne({
            where: { id: taskId }
        });

        if (!task) {
            return resolve({
                err: 1,
                msg: 'TASK NOT FOUND'
            });
        }

        const numericTaskId = typeof taskId === 'string' && !isNaN(taskId) ? parseInt(taskId, 10) : taskId;

        // Check if user is already watching this task
        const existingWatcher = await db.Task_Watcher.findOne({
            where: {
                task_id: numericTaskId,
                user_id: userId
            }
        });

        let isWatching = false;
        let action = '';

        if (existingWatcher) {
            // Remove watcher (unwatch)
            await existingWatcher.destroy();
            isWatching = false;
            action = 'UNWATCHED';
        } else {
            // Add watcher (watch)
            await db.Task_Watcher.create({
                task_id: numericTaskId,
                user_id: userId
            });
            isWatching = true;
            action = 'WATCHED';
        }

        // Log activity
        try {
            await db.Task_Activity.create({
                task_id: numericTaskId,
                user_id: userId,
                action: action,
                payload: { isWatching }
            });
        } catch (activityError) {
            console.error('Failed to create activity:', activityError);
        }

        // Reload task with all associations
        await task.reload({
            include: [
                { model: db.Users, as: 'assignedUser', attributes: ['id', 'username', 'email'] },
                { model: db.Project, as: 'project', attributes: ['id', 'name', 'description'] },
                { model: db.Users, as: 'watchers', attributes: ['id', 'username', 'email'], through: { attributes: [] } },
                { model: db.Task_Activity, as: 'activities', include: [{ model: db.Users, as: 'user', attributes: ['id', 'username', 'email'] }], order: [['createdAt', 'DESC']] }
            ]
        });

        resolve({
            err: 0,
            msg: 'OK',
            response: task,
            isWatching: isWatching
        });
    } catch (error) {
        resolve({
            err: 1,
            msg: 'FAILED TO WATCH/UNWATCH TASK: ' + error.message
        });
    }
});

//MARK TASK AS ACHIEVED (DONE)
export const achievedTaskService = (taskId, userId) => new Promise(async (resolve, reject) => {
    try {
        if (!userId) {
            return resolve({
                err: 1,
                msg: 'USER ID IS REQUIRED'
            });
        }

        const task = await db.Task.findOne({
            where: { id: taskId }
        });

        if (!task) {
            return resolve({
                err: 1,
                msg: 'TASK NOT FOUND'
            });
        }

        // Update task status to 'Done'
        await task.update({
            status: 'Done',
            updatedAt: new Date()
        });

        // Log activity
        try {
            const numericTaskId = typeof taskId === 'string' && !isNaN(taskId) ? parseInt(taskId, 10) : taskId;
            await db.Task_Activity.create({
                task_id: numericTaskId,
                user_id: userId,
                action: 'TASK_ACHIEVED',
                payload: { status: 'Done' }
            });
            console.log('Activity created for TASK_ACHIEVED:', { taskId: numericTaskId, userId });
        } catch (activityError) {
            console.error('Failed to create activity:', activityError);
        }

        // Reload task with all associations
        await task.reload({
            include: [
                { model: db.Users, as: 'assignedUser', attributes: ['id', 'username', 'email'] },
                { model: db.Project, as: 'project', attributes: ['id', 'name', 'description'] },
                { model: db.Users, as: 'watchers', attributes: ['id', 'username', 'email'], through: { attributes: [] } },
                { model: db.Task_Activity, as: 'activities', include: [{ model: db.Users, as: 'user', attributes: ['id', 'username', 'email'] }], order: [['createdAt', 'DESC']] }
            ]
        });

        resolve({
            err: 0,
            msg: 'OK',
            response: task
        });
    } catch (error) {
        resolve({
            err: 1,
            msg: 'FAILED TO MARK TASK AS ACHIEVED: ' + error.message
        });
    }
});

//ARCHIVE/UNARCHIVE TASK
export const archiveTaskService = (taskId, userId) => new Promise(async (resolve, reject) => {
    try {
        if (!userId) {
            return resolve({
                err: 1,
                msg: 'USER ID IS REQUIRED'
            });
        }

        const task = await db.Task.findOne({
            where: { id: taskId }
        });

        if (!task) {
            return resolve({
                err: 1,
                msg: 'TASK NOT FOUND'
            });
        }

        // Toggle archive status
        const newArchiveStatus = !task.isArchived;
        
        await task.update({
            isArchived: newArchiveStatus,
            updatedAt: new Date()
        });

        // Log activity
        try {
            const numericTaskId = typeof taskId === 'string' && !isNaN(taskId) ? parseInt(taskId, 10) : taskId;
            await db.Task_Activity.create({
                task_id: numericTaskId,
                user_id: userId,
                action: newArchiveStatus ? 'TASK_ARCHIVED' : 'TASK_UNARCHIVED',
                payload: { isArchived: newArchiveStatus }
            });
            console.log('Activity created for archive:', { taskId: numericTaskId, userId, isArchived: newArchiveStatus });
        } catch (activityError) {
            console.error('Failed to create activity:', activityError);
        }

        // Reload task with all associations
        await task.reload({
            include: [
                { model: db.Users, as: 'assignedUser', attributes: ['id', 'username', 'email'] },
                { model: db.Project, as: 'project', attributes: ['id', 'name', 'description'] },
                { model: db.Users, as: 'watchers', attributes: ['id', 'username', 'email'], through: { attributes: [] } },
                { model: db.Task_Activity, as: 'activities', include: [{ model: db.Users, as: 'user', attributes: ['id', 'username', 'email'] }], order: [['createdAt', 'DESC']] }
            ]
        });

        resolve({
            err: 0,
            msg: 'OK',
            response: task,
            isArchived: newArchiveStatus
        });
    } catch (error) {
        resolve({
            err: 1,
            msg: 'FAILED TO ARCHIVE/UNARCHIVE TASK: ' + error.message
        });
    }
});