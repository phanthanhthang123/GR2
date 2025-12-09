import db from '../models';
import { v4 } from 'uuid';

export const createWorkspaceService = (name, description, color, owner_id) => new Promise(async (resolve, reject) => {
    const transaction = await db.sequelize.transaction();
    try {
        // Tạo workspace
        const workspace = await db.Workspaces.create({
            id: v4(),
            name,
            description,
            color,
            owner_id,
            status: 'Active',
            createdAt: new Date(),
            updatedAt: new Date()
        }, { transaction });

        // Tự động thêm owner vào workspace_members với role Leader
        await db.Workspace_Members.create({
            workspace_id: workspace.id,
            user_id: owner_id,
            role: 'Leader',
            joined_at: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        }, { transaction });

        await transaction.commit();
        
        resolve({
            err: 0,
            msg: 'OK',
            response: workspace
        });
    } catch (error) {
        await transaction.rollback();
        reject(error);
    }
})

export const listWorkspaceByUserService = (user_id) => new Promise(async (resolve, reject) => {
    try {
        // Lấy tất cả workspace mà user là member (bao gồm cả owner và member)
        const response = await db.Workspaces.findAll({
            include: [
                {
                    model: db.Workspace_Members,
                    where: {
                        user_id: user_id
                    },
                    required: true,
                    as: 'members'
                },
                {
                    model: db.Users,
                    as: 'owner',
                    attributes: ['id', 'username', 'email']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        
        resolve({
            err: response ? 0 : 1,
            msg: response ? 'OK' : 'FAILED TO LIST WORKSPACE BY USER',
            response
        });
    }
    catch (error) {
        reject(error);
    }
})

export const getWorkspaceByIdService = (id) => new Promise(async (resolve, reject) => {
    try {
        const response = await db.Workspaces.findOne({
            where: { id: id },
            include: [
                {
                    model: db.Users,
                    as: 'owner',
                    attributes: ['id', 'username', 'email']
                },
                {
                    model: db.Workspace_Members,
                    as: 'members',
                    include: [
                        {
                            model: db.Users,
                            as: 'user',
                            attributes: ['id', 'username', 'email']
                        }
                    ]
                },
                {
                    model: db.Project,
                    as: 'projects',
                    include: [
                        {
                            model: db.Task,
                            as: 'tasks',
                            attributes: ['id', 'status']
                        }
                    ]
                }
            ]
        });
        
        resolve({
            err: response ? 0 : 1,
            msg: response ? 'OK' : 'WORKSPACE NOT FOUND',
            response
        });
    }
    catch (error) {
        reject(error);
    }
})

//ADD MEMBER TO WORKSPACE
export const addMemberToWorkspaceService = (workspaceId, email, role, userId, targetUserId) => new Promise(async (resolve, reject) => {
    try {
        // Check if workspace exists
        const workspace = await db.Workspaces.findOne({
            where: { id: workspaceId }
        });

        if (!workspace) {
            return resolve({
                err: 1,
                msg: 'WORKSPACE NOT FOUND'
            });
        }

        // Check if user has permission (must be Leader)
        if (userId) {
            const currentUserMember = await db.Workspace_Members.findOne({
                where: {
                    workspace_id: workspaceId,
                    user_id: userId
                }
            });

            if (!currentUserMember || currentUserMember.role !== 'Leader') {
                return resolve({
                    err: 1,
                    msg: 'ONLY LEADER CAN ADD MEMBERS TO WORKSPACE'
                });
            }
        }

        // Find user by email or user_id
        let user;
        if (email) {
            user = await db.Users.findOne({
                where: { email: email }
            });
        } else if (targetUserId) {
            user = await db.Users.findOne({
                where: { id: targetUserId }
            });
        } else {
            return resolve({
                err: 1,
                msg: 'EMAIL OR USER_ID IS REQUIRED'
            });
        }

        if (!user) {
            return resolve({
                err: 1,
                msg: 'USER NOT FOUND'
            });
        }

        // Check if user is already a member
        const existingMember = await db.Workspace_Members.findOne({
            where: {
                workspace_id: workspaceId,
                user_id: user.id
            }
        });

        if (existingMember) {
            return resolve({
                err: 1,
                msg: 'USER IS ALREADY A MEMBER OF THIS WORKSPACE'
            });
        }

        // Add member to workspace
        await db.Workspace_Members.create({
            workspace_id: workspaceId,
            user_id: user.id,
            role: role || 'Developer',
            joined_at: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Reload workspace with updated members
        const updatedWorkspace = await db.Workspaces.findOne({
            where: { id: workspaceId },
            include: [
                {
                    model: db.Users,
                    as: 'owner',
                    attributes: ['id', 'username', 'email']
                },
                {
                    model: db.Workspace_Members,
                    as: 'members',
                    include: [
                        {
                            model: db.Users,
                            as: 'user',
                            attributes: ['id', 'username', 'email']
                        }
                    ]
                }
            ]
        });

        resolve({
            err: 0,
            msg: 'OK',
            response: updatedWorkspace
        });
    } catch (error) {
        resolve({
            err: 1,
            msg: 'FAILED TO ADD MEMBER TO WORKSPACE: ' + error.message
        });
    }
})

//REMOVE MEMBER FROM WORKSPACE
export const removeMemberFromWorkspaceService = (workspaceId, targetUserId, currentUserId) => new Promise(async (resolve, reject) => {
    try {
        // Check if workspace exists
        const workspace = await db.Workspaces.findOne({
            where: { id: workspaceId }
        });

        if (!workspace) {
            return resolve({
                err: 1,
                msg: 'WORKSPACE NOT FOUND'
            });
        }

        // Check if user has permission (must be Leader)
        const currentUserMember = await db.Workspace_Members.findOne({
            where: {
                workspace_id: workspaceId,
                user_id: currentUserId
            }
        });

        // Check if current user is owner or Leader
        const isOwner = workspace.owner_id === currentUserId;
        const isLeader = currentUserMember && currentUserMember.role === 'Leader';

        if (!isOwner && !isLeader) {
            return resolve({
                err: 1,
                msg: 'ONLY LEADER CAN REMOVE MEMBERS FROM WORKSPACE'
            });
        }

        // Check if target user is a member
        const targetMember = await db.Workspace_Members.findOne({
            where: {
                workspace_id: workspaceId,
                user_id: targetUserId
            }
        });

        if (!targetMember) {
            return resolve({
                err: 1,
                msg: 'USER IS NOT A MEMBER OF THIS WORKSPACE'
            });
        }

        // Prevent removing owner
        if (workspace.owner_id === targetUserId) {
            return resolve({
                err: 1,
                msg: 'CANNOT REMOVE WORKSPACE OWNER'
            });
        }

        // Remove member from workspace
        await db.Workspace_Members.destroy({
            where: {
                workspace_id: workspaceId,
                user_id: targetUserId
            }
        });

        // Reload workspace with updated members
        const updatedWorkspace = await db.Workspaces.findOne({
            where: { id: workspaceId },
            include: [
                {
                    model: db.Users,
                    as: 'owner',
                    attributes: ['id', 'username', 'email']
                },
                {
                    model: db.Workspace_Members,
                    as: 'members',
                    include: [
                        {
                            model: db.Users,
                            as: 'user',
                            attributes: ['id', 'username', 'email']
                        }
                    ]
                }
            ]
        });

        resolve({
            err: 0,
            msg: 'OK',
            response: updatedWorkspace
        });
    } catch (error) {
        resolve({
            err: 1,
            msg: 'FAILED TO REMOVE MEMBER FROM WORKSPACE: ' + error.message
        });
    }
})