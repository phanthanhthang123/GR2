import * as services from '../services/comment';
import jwt from 'jsonwebtoken';

// Helper function to get userId from token
const getUserIdFromToken = (req) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
        ? authHeader.replace('Bearer ', '') 
        : (req.cookies?.accessToken || null);
    
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return decoded.id;
        } catch (error) {
            console.error('Token verification failed:', error.message);
            return null;
        }
    }
    return null;
};

export const getCommentsByTaskId = async (req, res) => {
    try {
        const { taskId } = req.params;
        
        if (!taskId) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: taskId'
            });
        }
        
        const response = await services.getCommentsByTaskIdService(taskId);
        if (response.err === 1) {
            return res.status(404).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at get comments controller: ' + error
        });
    }
};

export const createComment = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { content } = req.body;
        
        if (!taskId) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: taskId'
            });
        }
        
        if (!content || !content.trim()) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: content'
            });
        }

        const userId = getUserIdFromToken(req);
        if (!userId) {
            return res.status(401).json({
                err: 1,
                msg: 'Unauthorized: User ID not found'
            });
        }
        
        const response = await services.createCommentService(taskId, content, userId);
        if (response.err === 1) {
            const statusCode = response.msg === 'TASK NOT FOUND' ? 404 : 400;
            return res.status(statusCode).json(response);
        }
        return res.status(201).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at create comment controller: ' + error
        });
    }
};

export const updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        
        if (!commentId) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: commentId'
            });
        }
        
        if (!content || !content.trim()) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: content'
            });
        }

        const userId = getUserIdFromToken(req);
        if (!userId) {
            return res.status(401).json({
                err: 1,
                msg: 'Unauthorized: User ID not found'
            });
        }
        
        const response = await services.updateCommentService(commentId, content, userId);
        if (response.err === 1) {
            const statusCode = response.msg === 'COMMENT NOT FOUND' ? 404 : 403;
            return res.status(statusCode).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at update comment controller: ' + error
        });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        
        if (!commentId) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: commentId'
            });
        }

        const userId = getUserIdFromToken(req);
        if (!userId) {
            return res.status(401).json({
                err: 1,
                msg: 'Unauthorized: User ID not found'
            });
        }
        
        const response = await services.deleteCommentService(commentId, userId);
        if (response.err === 1) {
            const statusCode = response.msg === 'COMMENT NOT FOUND' ? 404 : 403;
            return res.status(statusCode).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at delete comment controller: ' + error
        });
    }
};

