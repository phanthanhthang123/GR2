import db from '../models';

// GET COMMENTS BY TASK ID
export const getCommentsByTaskIdService = (taskId) => new Promise(async (resolve, reject) => {
    try {
        const numericTaskId = typeof taskId === 'string' && !isNaN(taskId) ? parseInt(taskId, 10) : taskId;

        const comments = await db.Comment.findAll({
            where: { task_id: numericTaskId },
            include: [
                {
                    model: db.Users,
                    as: 'user',
                    attributes: ['id', 'username', 'email']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        resolve({
            err: 0,
            msg: 'OK',
            response: comments || []
        });
    } catch (error) {
        console.error('Error getting comments:', error);
        resolve({
            err: 1,
            msg: 'FAILED TO GET COMMENTS: ' + error.message,
            response: []
        });
    }
});

// CREATE COMMENT
export const createCommentService = (taskId, content, userId) => new Promise(async (resolve, reject) => {
    try {
        const numericTaskId = typeof taskId === 'string' && !isNaN(taskId) ? parseInt(taskId, 10) : taskId;

        if (!content || !content.trim()) {
            return resolve({
                err: 1,
                msg: 'Comment content cannot be empty'
            });
        }

        if (!userId) {
            return resolve({
                err: 1,
                msg: 'User ID is required'
            });
        }

        // Check if task exists
        const task = await db.Task.findOne({
            where: { id: numericTaskId }
        });

        if (!task) {
            return resolve({
                err: 1,
                msg: 'TASK NOT FOUND'
            });
        }

        const comment = await db.Comment.create({
            task_id: numericTaskId,
            user_id: userId,
            content: content.trim()
        });

        // Reload with user information
        await comment.reload({
            include: [
                {
                    model: db.Users,
                    as: 'user',
                    attributes: ['id', 'username', 'email']
                }
            ]
        });

        // Create activity log
        try {
            await db.Task_Activity.create({
                task_id: numericTaskId,
                user_id: userId,
                action: 'added_comment',
                payload: { commentId: comment.id }
            });
        } catch (activityError) {
            console.error('Failed to create activity:', activityError);
        }

        resolve({
            err: 0,
            msg: 'OK',
            response: comment
        });
    } catch (error) {
        console.error('Error creating comment:', error);
        resolve({
            err: 1,
            msg: 'FAILED TO CREATE COMMENT: ' + error.message
        });
    }
});

// UPDATE COMMENT
export const updateCommentService = (commentId, content, userId) => new Promise(async (resolve, reject) => {
    try {
        if (!content || !content.trim()) {
            return resolve({
                err: 1,
                msg: 'Comment content cannot be empty'
            });
        }

        const comment = await db.Comment.findOne({
            where: { id: commentId }
        });

        if (!comment) {
            return resolve({
                err: 1,
                msg: 'COMMENT NOT FOUND'
            });
        }

        // Check if user owns the comment
        if (comment.user_id !== userId) {
            return resolve({
                err: 1,
                msg: 'You do not have permission to edit this comment'
            });
        }

        await comment.update({
            content: content.trim(),
            updatedAt: new Date()
        });

        // Reload with user information
        await comment.reload({
            include: [
                {
                    model: db.Users,
                    as: 'user',
                    attributes: ['id', 'username', 'email']
                }
            ]
        });

        // Create activity log
        try {
            const numericTaskId = typeof comment.task_id === 'string' && !isNaN(comment.task_id) 
                ? parseInt(comment.task_id, 10) 
                : comment.task_id;
            await db.Task_Activity.create({
                task_id: numericTaskId,
                user_id: userId,
                action: 'edited_comment',
                payload: { commentId: comment.id }
            });
        } catch (activityError) {
            console.error('Failed to create activity:', activityError);
            // Don't fail the whole operation if activity creation fails
        }

        resolve({
            err: 0,
            msg: 'OK',
            response: comment
        });
    } catch (error) {
        console.error('Error updating comment:', error);
        resolve({
            err: 1,
            msg: 'FAILED TO UPDATE COMMENT: ' + error.message
        });
    }
});

// DELETE COMMENT
export const deleteCommentService = (commentId, userId) => new Promise(async (resolve, reject) => {
    try {
        const comment = await db.Comment.findOne({
            where: { id: commentId }
        });

        if (!comment) {
            return resolve({
                err: 1,
                msg: 'COMMENT NOT FOUND'
            });
        }

        // Check if user owns the comment
        if (comment.user_id !== userId) {
            return resolve({
                err: 1,
                msg: 'You do not have permission to delete this comment'
            });
        }

        const taskId = comment.task_id;

        await comment.destroy();

        resolve({
            err: 0,
            msg: 'OK',
            response: { taskId }
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        resolve({
            err: 1,
            msg: 'FAILED TO DELETE COMMENT: ' + error.message
        });
    }
});

