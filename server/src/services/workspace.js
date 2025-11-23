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