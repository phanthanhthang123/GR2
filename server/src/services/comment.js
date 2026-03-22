import db from '../models';

// GET COMMENTS BY TASK ID (only top-level comments, no replies)
export const getCommentsByTaskIdService = (taskId) => new Promise(async (resolve, reject) => {
    try {
        const numericTaskId = typeof taskId === 'string' && !isNaN(taskId) ? parseInt(taskId, 10) : taskId;

        const comments = await db.Comment.findAll({
            where: { 
                task_id: numericTaskId,
                parent_id: null // Only get top-level comments
            },
            include: [
                {
                    model: db.Users,
                    as: 'user',
                    attributes: ['id', 'username', 'email', 'avatarUrl']
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

// GET REPLIES BY COMMENT ID
export const getRepliesByCommentIdService = (commentId) => new Promise(async (resolve, reject) => {
    try {
        const numericCommentId = typeof commentId === 'string' && !isNaN(commentId) ? parseInt(commentId, 10) : commentId;

        const replies = await db.Comment.findAll({
            where: { parent_id: numericCommentId },
            include: [
                {
                    model: db.Users,
                    as: 'user',
                    attributes: ['id', 'username', 'email', 'avatarUrl']
                }
            ],
            order: [['createdAt', 'ASC']]
        });

        resolve({
            err: 0,
            msg: 'OK',
            response: replies || []
        });
    } catch (error) {
        console.error('Error getting replies:', error);
        resolve({
            err: 1,
            msg: 'FAILED TO GET REPLIES: ' + error.message,
            response: []
        });
    }
});

// CREATE COMMENT
export const createCommentService = (taskId, content, userId, parentId = null) => new Promise(async (resolve, reject) => {
    try {
        const numericTaskId = typeof taskId === 'string' && !isNaN(taskId) ? parseInt(taskId, 10) : taskId;
        const numericParentId = parentId ? (typeof parentId === 'string' && !isNaN(parentId) ? parseInt(parentId, 10) : parentId) : null;

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

        // If parentId is provided, verify the parent comment exists
        if (numericParentId) {
            const parentComment = await db.Comment.findOne({
                where: { id: numericParentId }
            });
            if (!parentComment) {
                return resolve({
                    err: 1,
                    msg: 'PARENT COMMENT NOT FOUND'
                });
            }
            // Use the same task_id as parent
            const taskIdToUse = parentComment.task_id;
            
            const comment = await db.Comment.create({
                task_id: taskIdToUse,
                user_id: userId,
                content: content.trim(),
                parent_id: numericParentId
            });

            // Reload with user information
            await comment.reload({
                include: [
                    {
                        model: db.Users,
                        as: 'user',
                        attributes: ['id', 'username', 'email', 'avatarUrl']
                    }
                ]
            });

            // Create activity log
            try {
                await db.Task_Activity.create({
                    task_id: taskIdToUse,
                    user_id: userId,
                    action: 'added_reply',
                    payload: { commentId: comment.id, parentCommentId: numericParentId }
                });
            } catch (activityError) {
                console.error('Failed to create activity:', activityError);
            }

            resolve({
                err: 0,
                msg: 'OK',
                response: comment
            });
            return;
        }

        // Check if task exists (for top-level comments)
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
            content: content.trim(),
            parent_id: null
        });

        // Reload with user information
        await comment.reload({
            include: [
                {
                    model: db.Users,
                    as: 'user',
                    attributes: ['id', 'username', 'email', 'avatarUrl']
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
                    attributes: ['id', 'username', 'email', 'avatarUrl']
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

