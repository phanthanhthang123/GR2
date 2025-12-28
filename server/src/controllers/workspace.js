import * as services from '../services/workspace';

export const createWorkspace = async (req,res)=>{
    try {
        const {name, description, color, owner_id} = req.body;
        if(!name || !color || !owner_id) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameters: name, color, owner_id'
            })
        }
        const response = await services.createWorkspaceService(name, description, color, owner_id);
        if(response.err === 1) {
            return res.status(400).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at create workspace controller: ' + error
        })
    }
}

export const listWorkspaceByUser = async (req,res)=>{
    try {
        const {user_id} = req.body;
        if(!user_id) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: user_id'
            })
        }
        const response = await services.listWorkspaceByUserService(user_id);
        if(response.err === 1) {
            return res.status(400).json(response);
        }
        return res.status(200).json(response?.response);
    }
    catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at list workspace by user controller: ' + error
        })
    }
}

export const getWorkspaceById = async (req,res)=>{
    try {
        const {id} = req.params;
        if(!id) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: id'
            })
        }
        const response = await services.getWorkspaceByIdService(id);
        if(response.err === 1) {
            return res.status(400).json(response);
        }
        return res.status(200).json(response?.response);
    }
    catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at get workspace by id controller: ' + error
        })
    }
}

export const addMemberToWorkspace = async (req,res)=>{
    try {
        const {workspaceId} = req.params;
        const {email, role, userId: targetUserId} = req.body;
        
        if(!workspaceId) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: workspaceId'
            })
        }
        
        if(!email && !targetUserId) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: email or userId'
            })
        }

        // Get userId from token
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') 
            ? authHeader.replace('Bearer ', '') 
            : (req.cookies?.accessToken || null);
        
        let currentUserId = null;
        if (token) {
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                currentUserId = decoded.id;
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

        const response = await services.addMemberToWorkspaceService(workspaceId, email || null, role, currentUserId, targetUserId || null);
        if(response.err === 1) {
            const statusCode = response.msg === 'WORKSPACE NOT FOUND' || response.msg === 'USER NOT FOUND' ? 404 : 
                              response.msg === 'ONLY LEADER CAN ADD MEMBERS TO WORKSPACE' ? 403 : 400;
            return res.status(statusCode).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at add member to workspace controller: ' + error
        })
    }
}

export const removeMemberFromWorkspace = async (req,res)=>{
    try {
        const {workspaceId, userId: targetUserId} = req.params;
        
        if(!workspaceId || !targetUserId) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameters: workspaceId and userId'
            })
        }

        // Get userId from token
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') 
            ? authHeader.replace('Bearer ', '') 
            : (req.cookies?.accessToken || null);
        
        let currentUserId = null;
        if (token) {
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                currentUserId = decoded.id;
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

        const response = await services.removeMemberFromWorkspaceService(workspaceId, targetUserId, currentUserId);
        if(response.err === 1) {
            const statusCode = response.msg === 'WORKSPACE NOT FOUND' || response.msg === 'USER IS NOT A MEMBER OF THIS WORKSPACE' ? 404 : 
                              response.msg === 'ONLY LEADER CAN REMOVE MEMBERS FROM WORKSPACE' || response.msg === 'CANNOT REMOVE WORKSPACE OWNER' ? 403 : 400;
            return res.status(statusCode).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at remove member from workspace controller: ' + error
        })
    }
}

export const getWorkspaceStats = async (req,res)=>{
    try {
        const {workspaceId} = req.params;
        if(!workspaceId) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: workspaceId'
            })
        }
        const response = await services.getWorkspaceStatsService(workspaceId);
        if(response.err === 1) {
            return res.status(404).json(response);
        }
        return res.status(200).json(response?.response);
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            err : -1,
            msg : 'Internal server error'
        })
    }
}

export const getWorkspaceProjectsDetail = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        if (!workspaceId) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: workspaceId'
            });
        }
        const response = await services.getWorkspaceProjectsDetailService(workspaceId);
        if (response.err === 1) {
            return res.status(404).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Internal server error'
        });
    }
}

export const getWorkspaceTasksDetail = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        if (!workspaceId) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: workspaceId'
            });
        }
        const response = await services.getWorkspaceTasksDetailService(workspaceId);
        if (response.err === 1) {
            return res.status(404).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Internal server error'
        });
    }
}

export const getWorkspaceMembersDetail = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        if (!workspaceId) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameter: workspaceId'
            });
        }
        const response = await services.getWorkspaceMembersDetailService(workspaceId);
        if (response.err === 1) {
            return res.status(404).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        console.error('Error in getWorkspaceMembersDetail controller:', error);
        return res.status(500).json({
            err: -1,
            msg: 'Internal server error: ' + error.message
        });
    }
}

export const getWorkspaceTasksByStatus = async (req, res) => {
    try {
        const { workspaceId, status } = req.params;
        if (!workspaceId || !status) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing required parameters: workspaceId and status'
            });
        }
        const response = await services.getWorkspaceTasksByStatusService(workspaceId, status);
        if (response.err === 1) {
            return res.status(404).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Internal server error'
        });
    }
}