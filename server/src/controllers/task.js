import * as services from '../services/task';
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

export const createTask = async (req, res) => {
    try {
        const { projectId } = req.params;
        const taskData = req.body;
        const userId = getUserIdFromToken(req);
        if (!projectId) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: projectId'
            })
        }
        if (!taskData || !taskData.title || !taskData.status || !taskData.priority) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: taskData.title, taskData.status, or taskData.priority'
            })
        }
        
        // Set default values for optional fields
        taskData.description = taskData.description || "";
        taskData.dueDate = taskData.dueDate || null;
        taskData.assignees = taskData.assignees || [];
        const response = await services.createTaskService(projectId, taskData, userId);
        if (response.err === 1) {
            return res.status(400).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at create task controller: ' + error
        })
    }
}

export const getTaskById = async (req, res) => {
    try {
        const { taskId } = req.params;
        if (!taskId) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: taskId'
            })
        }
        // Lấy userId từ token để kiểm tra quyền truy cập task
        const userId = getUserIdFromToken(req);
        const response = await services.getTaskByIdService(taskId, userId);
        if (response.err === 1) {
            return res.status(404).json(response);
        }
        if (response.err === 2) {
            return res.status(403).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at get task by id controller: ' + error
        })
    }
}

export const getTaskActivities = async (req, res) => {
    try {
        const { taskId } = req.params;
        if (!taskId) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: taskId'
            })
        }
        const response = await services.getTaskActivitiesService(taskId);
        if (response.err === 1) {
            return res.status(404).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at get task activities controller: ' + error
        })
    }
}

export const updateTaskTitle = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title } = req.body;

        if (!taskId) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: taskId'
            })
        }

        if (!title || title.trim() === '') {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: title'
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
        if (response.err === 1) {
            return res.status(404).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at update task title controller: ' + error
        })
    }
}

export const updateTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;

        if (!taskId) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: taskId'
            })
        }

        if (!status) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: status'
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
        if (response.err === 1) {
            return res.status(404).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at update task status controller: ' + error
        })
    }
}

export const updateTaskDescription = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { description } = req.body;

        if (!taskId) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: taskId'
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
        if (response.err === 1) {
            return res.status(404).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at update task description controller: ' + error
        })
    }
}

export const updateTaskAssignees = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { assignees } = req.body;

        if (!taskId) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: taskId'
            })
        }

        if (!Array.isArray(assignees)) {
            return res.status(400).json({
                err: 1,
                msg: 'assignees must be an array'
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
        if (response.err === 1) {
            return res.status(404).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at update task assignees controller: ' + error
        })
    }
}

export const updateTaskDueDate = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { dueDate } = req.body;

        if (!taskId) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: taskId'
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

        const response = await services.updateTaskDueDateService(taskId, dueDate, userId);
        if (response.err === 1) {
            const statusCode = response.msg === 'TASK NOT FOUND' ? 404 : 400;
            return res.status(statusCode).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at update task due date controller: ' + error
        })
    }
}

export const updateTaskPriority = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { priority } = req.body;

        if (!taskId) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: taskId'
            })
        }

        if (!priority) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: priority'
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
        if (response.err === 1) {
            const statusCode = response.msg === 'TASK NOT FOUND' ? 404 : 400;
            return res.status(statusCode).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at update task priority controller: ' + error
        })
    }
}

export const watchTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        if (!taskId) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: taskId'
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
        if (response.err === 1) {
            const statusCode = response.msg === 'TASK NOT FOUND' ? 404 : 400;
            return res.status(statusCode).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at watch task controller: ' + error
        })
    }
}

export const achievedTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        if (!taskId) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: taskId'
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
        if (response.err === 1) {
            const statusCode = response.msg === 'TASK NOT FOUND' ? 404 : 400;
            return res.status(statusCode).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at achieved task controller: ' + error
        })
    }
}

export const archiveTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        if (!taskId) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: taskId'
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
        if (response.err === 1) {
            const statusCode = response.msg === 'TASK NOT FOUND' ? 404 : 400;
            return res.status(statusCode).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at archive task controller: ' + error
        })
    }
}

export const getMyTasks = async (req, res) => {
    try {
        const { workspaceId } = req.query;
        const userId = getUserIdFromToken(req);

        if (!workspaceId) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: workspaceId'
            });
        }

        if (!userId) {
            return res.status(401).json({
                err: 1,
                msg: 'Unauthorized: User ID not found'
            });
        }

        const response = await services.getMyTasksService(userId, workspaceId);
        
        // Only return error status if there's an actual error
        // Empty tasks array is not an error
        if (response.err === 1) {
            // Return 400 for service errors, not 404
            return res.status(400).json(response);
        }
        
        // Always return 200 with tasks (even if empty array)
        return res.status(200).json(response);
    } catch (error) {
        console.error('Error in getMyTasks controller:', error);
        return res.status(500).json({
            err: -1,
            msg: 'Failed at get my tasks controller: ' + error.message
        });
    }
}