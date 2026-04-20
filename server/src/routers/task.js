import express from 'express';
import * as controllers from '../controllers/task'
import * as commentControllers from '../controllers/comment'

//CRUD
const router = express.Router();
// Get my tasks - must be before /:taskId route to avoid conflict
router.get('/my-tasks', controllers.getMyTasks);
router.get('/:taskId', controllers.getTaskById);
router.get('/:taskId/activity', controllers.getTaskActivities);
router.post('/:projectId/create-task',controllers.createTask);
router.put('/:taskId/update-title', controllers.updateTaskTitle);
router.put('/:taskId/update-status', controllers.updateTaskStatus);
router.put('/:taskId/update-description', controllers.updateTaskDescription);
router.put('/:taskId/update-assignees', controllers.updateTaskAssignees);
router.put('/:taskId/update-priority', controllers.updateTaskPriority);
router.put('/:taskId/update-difficulty', controllers.updateTaskDifficulty);
router.put('/:taskId/update-due-date', controllers.updateTaskDueDate);
router.put('/:taskId/update-pull-request-url', controllers.updateTaskPullRequestUrl);
router.post('/:taskId/watch', controllers.watchTask);
router.post('/:taskId/achieved', controllers.achievedTask);
router.post('/:taskId/archive', controllers.archiveTask);

// Comment routes
router.get('/:taskId/comments', commentControllers.getCommentsByTaskId);
router.post('/:taskId/comments', commentControllers.createComment);
router.put('/comments/:commentId', commentControllers.updateComment);
router.delete('/comments/:commentId', commentControllers.deleteComment);

export default router;