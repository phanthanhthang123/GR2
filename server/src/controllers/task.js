import * as services from '../services/task';
import jwt from 'jsonwebtoken';

export const createTask = async (req,res)=>{
    try {
        const {projectId} = req.params;
        const taskData = req.body;
        if(!projectId) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: projectId'
            })
        }
        if(!taskData || !taskData.title || !taskData.description || !taskData.status || !taskData.priority || !taskData.dueDate || !taskData.assignees) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: taskData or its fields'
            })
        }
        const response = await services.createTaskService(projectId, taskData);
        if(response.err === 1) {
            return res.status(400).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at create task controller: ' + error
        })
    }
}

export const getTaskById = async (req,res)=>{
    try {
        const {taskId} = req.params;
        if(!taskId) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: taskId'
            })
        }
        const response = await services.getTaskByIdService(taskId);
        if(response.err === 1) {
            return res.status(404).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at get task by id controller: ' + error
        })
    }
}

export const getTaskActivities = async (req,res)=>{
    try {
        const {taskId} = req.params;
        if(!taskId) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: taskId'
            })
        }
        const response = await services.getTaskActivitiesService(taskId);
        if(response.err === 1) {
            return res.status(404).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at get task activities controller: ' + error
        })
    }
}

export const updateTaskTitle = async (req,res)=>{
    try {
        const {taskId} = req.params;
        const {title} = req.body;
        
        if(!taskId) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: taskId'
            })
        }
        
        if(!title || title.trim() === '') {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: title'
            })
        }

        // Get userId from token
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') 
            ? authHeader.replace('Bearer ', '') 
            : (req.cookies?.accessToken || null);
        
        let userId = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
                console.log('Token decoded successfully, userId:', userId);
            } catch (error) {
                // Token invalid, but continue without userId
                console.error('Token verification failed:', error.message);
                console.log('Token received:', token ? token.substring(0, 20) + '...' : 'null');
            }
        } else {
            console.log('No token found in request');
        }
        
        const response = await services.updateTaskTitleService(taskId, title.trim(), userId);
        if(response.err === 1) {
            return res.status(404).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at update task title controller: ' + error
        })
    }
}

export const updateTaskStatus = async (req,res)=>{
    try {
        const {taskId} = req.params;
        const {status} = req.body;
        
        if(!taskId) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: taskId'
            })
        }
        
        if(!status) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: status'
            })
        }

        // Get userId from token
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') 
            ? authHeader.replace('Bearer ', '') 
            : (req.cookies?.accessToken || null);
        
        let userId = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
                console.log('Token decoded successfully, userId:', userId);
            } catch (error) {
                // Token invalid, but continue without userId
                console.error('Token verification failed:', error.message);
                console.log('Token received:', token ? token.substring(0, 20) + '...' : 'null');
            }
        } else {
            console.log('No token found in request');
        }
        
        const response = await services.updateTaskStatusService(taskId, status, userId);
        if(response.err === 1) {
            return res.status(404).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at update task status controller: ' + error
        })
    }
}

export const updateTaskDescription = async (req,res)=>{
    try {
        const {taskId} = req.params;
        const {description} = req.body;
        
        if(!taskId) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: taskId'
            })
        }

        // Get userId from token
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') 
            ? authHeader.replace('Bearer ', '') 
            : (req.cookies?.accessToken || null);
        
        let userId = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
                console.log('Token decoded successfully, userId:', userId);
            } catch (error) {
                // Token invalid, but continue without userId
                console.error('Token verification failed:', error.message);
                console.log('Token received:', token ? token.substring(0, 20) + '...' : 'null');
            }
        } else {
            console.log('No token found in request');
        }
        
        // Description can be null or empty string, so we allow it
        const response = await services.updateTaskDescriptionService(taskId, description, userId);
        if(response.err === 1) {
            return res.status(404).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at update task description controller: ' + error
        })
    }
}

export const updateTaskAssignees = async (req,res)=>{
    try {
        const {taskId} = req.params;
        const {assignees} = req.body;
        
        if(!taskId) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: taskId'
            })
        }
        
        if(!Array.isArray(assignees)) {
            return res.status(400).json({
                err : 1,
                msg : 'assignees must be an array'
            })
        }

        // Get userId from token
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') 
            ? authHeader.replace('Bearer ', '') 
            : (req.cookies?.accessToken || null);
        
        let userId = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
                console.log('Token decoded successfully, userId:', userId);
            } catch (error) {
                // Token invalid, but continue without userId
                console.error('Token verification failed:', error.message);
                console.log('Token received:', token ? token.substring(0, 20) + '...' : 'null');
            }
        } else {
            console.log('No token found in request');
        }
        
        const response = await services.updateTaskAssigneesService(taskId, assignees, userId);
        if(response.err === 1) {
            return res.status(404).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at update task assignees controller: ' + error
        })
    }
}

export const updateTaskPriority = async (req,res)=>{
    try {
        const {taskId} = req.params;
        const {priority} = req.body;
        
        if(!taskId) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: taskId'
            })
        }
        
        if(!priority) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: priority'
            })
        }

        // Get userId from token
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') 
            ? authHeader.replace('Bearer ', '') 
            : (req.cookies?.accessToken || null);
        
        let userId = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
                console.log('Token decoded successfully, userId:', userId);
            } catch (error) {
                // Token invalid, but continue without userId
                console.error('Token verification failed:', error.message);
                console.log('Token received:', token ? token.substring(0, 20) + '...' : 'null');
            }
        } else {
            console.log('No token found in request');
        }
        
        const response = await services.updateTaskPriorityService(taskId, priority, userId);
        if(response.err === 1) {
            const statusCode = response.msg === 'TASK NOT FOUND' ? 404 : 400;
            return res.status(statusCode).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at update task priority controller: ' + error
        })
    }
}

export const watchTask = async (req,res)=>{
    try {
        const {taskId} = req.params;
        
        if(!taskId) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: taskId'
            })
        }

        // Get userId from token
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') 
            ? authHeader.replace('Bearer ', '') 
            : (req.cookies?.accessToken || null);
        
        let userId = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
                console.log('Token decoded successfully, userId:', userId);
            } catch (error) {
                return res.status(401).json({
                    err: 1,
                    msg: 'UNAUTHORIZED: Invalid or expired token'
                });
            }
        } else {
            return res.status(401).json({
                err: 1,
                msg: 'UNAUTHORIZED: No token provided'
            });
        }
        
        const response = await services.watchTaskService(taskId, userId);
        if(response.err === 1) {
            const statusCode = response.msg === 'TASK NOT FOUND' ? 404 : 400;
            return res.status(statusCode).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at watch task controller: ' + error
        })
    }
}

export const achievedTask = async (req,res)=>{
    try {
        const {taskId} = req.params;
        
        if(!taskId) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: taskId'
            })
        }

        // Get userId from token
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') 
            ? authHeader.replace('Bearer ', '') 
            : (req.cookies?.accessToken || null);
        
        let userId = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
                console.log('Token decoded successfully, userId:', userId);
            } catch (error) {
                return res.status(401).json({
                    err: 1,
                    msg: 'UNAUTHORIZED: Invalid or expired token'
                });
            }
        } else {
            return res.status(401).json({
                err: 1,
                msg: 'UNAUTHORIZED: No token provided'
            });
        }
        
        const response = await services.achievedTaskService(taskId, userId);
        if(response.err === 1) {
            const statusCode = response.msg === 'TASK NOT FOUND' ? 404 : 400;
            return res.status(statusCode).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at achieved task controller: ' + error
        })
    }
}

export const archiveTask = async (req,res)=>{
    try {
        const {taskId} = req.params;
        
        if(!taskId) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: taskId'
            })
        }

        // Get userId from token
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') 
            ? authHeader.replace('Bearer ', '') 
            : (req.cookies?.accessToken || null);
        
        let userId = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id;
                console.log('Token decoded successfully, userId:', userId);
            } catch (error) {
                return res.status(401).json({
                    err: 1,
                    msg: 'UNAUTHORIZED: Invalid or expired token'
                });
            }
        } else {
            return res.status(401).json({
                err: 1,
                msg: 'UNAUTHORIZED: No token provided'
            });
        }
        
        const response = await services.archiveTaskService(taskId, userId);
        if(response.err === 1) {
            const statusCode = response.msg === 'TASK NOT FOUND' ? 404 : 400;
            return res.status(statusCode).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at archive task controller: ' + error
        })
    }
}