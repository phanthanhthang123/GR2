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

//GET WORKSPACE STATS
export const getWorkspaceStatsService = (workspaceId) => new Promise(async (resolve, reject) => {
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

        // Get all projects in workspace
        const projects = await db.Project.findAll({
            where: { workspace_id: workspaceId },
            include: [
                {
                    model: db.Task,
                    as: 'tasks',
                    where: { isArchived: false },
                    required: false
                }
            ]
        });

        // Get all tasks in workspace (through projects)
        // Đảm bảo project_id được include trong kết quả
        const allTasks = await db.Task.findAll({
            include: [
                {
                    model: db.Project,
                    as: 'project',
                    where: { workspace_id: workspaceId },
                    required: true,
                    attributes: ['id', 'name'] // Include project id và name để có thể sử dụng
                }
            ],
            where: { isArchived: false }
            // project_id sẽ tự động được include vì nó là field của Task model
        });

        // Get total members in workspace
        const workspaceMembers = await db.Workspace_Members.findAll({
            where: { workspace_id: workspaceId }
        });

        // Calculate stats
        const totalProjects = projects.length;
        const totalTasks = allTasks.length;
        const totalProjectInProgress = projects.filter(p => p.status === 'In Progress').length;
        const totalTaskCompleted = allTasks.filter(t => t.status === 'Done').length;
        const totalTaskToDo = allTasks.filter(t => t.status === 'To Do').length;
        const totalTaskInProgress = allTasks.filter(t => t.status === 'In Progress').length;
        const totalMembers = workspaceMembers.length;

        const stats = {
            totalProjects,
            totalTasks,
            totalProjectInProgress,
            totalTaskCompleted,
            totalTaskToDo,
            totalTaskInProgress,
            totalMembers
        };

        // Task Trends Data (last 7 days)
        const taskTrendsData = [];
        const today = new Date();
        // Normalize today to UTC midnight
        const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
        
        // Debug: Log total tasks and today's date
        console.log(`[Task Trends] Total tasks in workspace: ${allTasks.length}`);
        console.log(`[Task Trends] Today's date (local): ${today.toISOString().split('T')[0]}`);
        console.log(`[Task Trends] Today's date (UTC): ${todayUTC.toISOString().split('T')[0]}`);
        
        // Helper function to normalize date to UTC date string (YYYY-MM-DD)
        const getUTCDateString = (dateValue) => {
            if (!dateValue) return null;
            const date = new Date(dateValue);
            // Get UTC date components
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(todayUTC);
            date.setUTCDate(date.getUTCDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Count tasks created on this day
            const tasksCreated = allTasks.filter(t => {
                if (!t.createdAt) return false;
                const createdDateStr = getUTCDateString(t.createdAt);
                if (createdDateStr === dateStr) {
                    console.log(`[Task Trends] Match found! Task ${t.id} created on ${createdDateStr} matches ${dateStr}`);
                    return true;
                }
                return false;
            }).length;

            // Count tasks completed on this day (status = 'Done' and updated on this day)
            const tasksCompleted = allTasks.filter(t => {
                if (t.status !== 'Done') return false;
                if (!t.updatedAt) return false;
                const updatedDateStr = getUTCDateString(t.updatedAt);
                if (updatedDateStr === dateStr) {
                    console.log(`[Task Trends] Match found! Task ${t.id} completed on ${updatedDateStr} matches ${dateStr}`);
                    return true;
                }
                return false;
            }).length;

            taskTrendsData.push({
                date: dateStr,
                created: tasksCreated,
                completed: tasksCompleted
            });
            
            // Debug: Log all dates being checked
            console.log(`[Task Trends] Checking date ${dateStr}: Created=${tasksCreated}, Completed=${tasksCompleted}`);
        }
        
        // Debug: Log all task dates for comparison
        console.log('[Task Trends] All task dates:');
        allTasks.forEach(t => {
            const createdStr = getUTCDateString(t.createdAt);
            const updatedStr = getUTCDateString(t.updatedAt);
            console.log(`  Task ${t.id}: createdAt=${createdStr}, updatedAt=${updatedStr}, status=${t.status}`);
        });
        
        // Debug: Log sample task dates
        if (allTasks.length > 0) {
            const sampleTasks = allTasks.slice(0, 3);
            console.log('[Task Trends] Sample tasks:', sampleTasks.map(t => ({
                id: t.id,
                title: t.title,
                status: t.status,
                createdAt: t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : null,
                updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString().split('T')[0] : null
            })));
        }

        // Project Status Data
        const projectStatusData = [
            { status: 'Pending', count: projects.filter(p => p.status === 'Pending').length },
            { status: 'In Progress', count: projects.filter(p => p.status === 'In Progress').length },
            { status: 'Completed', count: projects.filter(p => p.status === 'Completed').length }
        ];

        // Task Priority Data
        const taskPriorityData = [
            { priority: 'High', count: allTasks.filter(t => t.priority === 'High').length },
            { priority: 'Medium', count: allTasks.filter(t => t.priority === 'Medium').length },
            { priority: 'Low', count: allTasks.filter(t => t.priority === 'Low').length }
        ];

        // Workspace Productivity Data (task completion by project)
        // Sử dụng trực tiếp tasks từ project association thay vì filter từ allTasks
        const workspaceProductivityData = projects.map(project => {
            // Lấy tasks từ project association (đã được load với include)
            // Nếu không có trong association, fallback về filter từ allTasks
            let projectTasks = [];
            
            if (project.tasks && project.tasks.length > 0) {
                // Sử dụng tasks từ association (đã được filter isArchived: false trong include)
                projectTasks = project.tasks;
            } else {
                // Fallback: filter từ allTasks
                projectTasks = allTasks.filter(t => {
                    const taskProjectId = t.project_id || (t.project && t.project.id);
                    return taskProjectId === project.id;
                });
            }
            
            const completedTasks = projectTasks.filter(t => t.status === 'Done').length;
            const totalTasks = projectTasks.length;
            
            // Debug log để kiểm tra
            console.log(`[Workspace Productivity] Project: ${project.name} (${project.id})`);
            console.log(`  - Using ${project.tasks ? 'association' : 'filtered'} tasks`);
            console.log(`  - Total tasks: ${totalTasks}, Completed: ${completedTasks}`);
            if (totalTasks === 0 && allTasks.length > 0) {
                const sampleTask = allTasks.find(t => {
                    const taskProjectId = t.project_id || (t.project && t.project.id);
                    return taskProjectId === project.id;
                });
                if (sampleTask) {
                    console.log(`  - Found task but not counted: project_id=${sampleTask.project_id}, project.id=${sampleTask.project?.id}`);
                }
            }
            
            return {
                projectName: project.name,
                completed: completedTasks,
                total: totalTasks
            };
        });

        // Upcoming Tasks (tasks with dueDate in next 7 days)
        const upcomingDate = new Date();
        upcomingDate.setDate(upcomingDate.getDate() + 7);
        const upcomingTasks = await db.Task.findAll({
            include: [
                {
                    model: db.Project,
                    as: 'project',
                    where: { workspace_id: workspaceId },
                    required: true,
                    attributes: ['id', 'name']
                },
                {
                    model: db.Users,
                    as: 'assignedUser',
                    attributes: ['id', 'username', 'email'],
                    required: false
                }
            ],
            where: {
                isArchived: false,
                dueDate: {
                    [db.Sequelize.Op.between]: [new Date(), upcomingDate]
                },
                status: {
                    [db.Sequelize.Op.ne]: 'Done'
                }
            },
            order: [['dueDate', 'ASC']],
            limit: 10
        });

        // Recent Tasks (last 10 tasks created)
        const recentTasks = await db.Task.findAll({
            include: [
                {
                    model: db.Project,
                    as: 'project',
                    where: { workspace_id: workspaceId },
                    required: true,
                    attributes: ['id', 'name']
                },
                {
                    model: db.Users,
                    as: 'assignedUser',
                    attributes: ['id', 'username', 'email'],
                    required: false
                }
            ],
            where: { isArchived: false },
            order: [['createdAt', 'DESC']],
            limit: 10
        });

        // Recent Projects (last 5 projects created)
        const recentProjects = projects
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
            .map(project => ({
                id: project.id,
                name: project.name,
                description: project.description,
                status: project.status,
                start_date: project.start_date,
                end_date: project.end_date,
                createdAt: project.createdAt
            }));

        resolve({
            err: 0,
            msg: 'OK',
            response: {
                stats,
                taskTrendsData,
                projectStatusData,
                taskPriorityData,
                workspaceProductivityData,
                upcomingTasks,
                recentTasks,
                recentProjects
            }
        });
    } catch (error) {
        reject(error);
    }
})

// GET WORKSPACE PROJECTS DETAIL
export const getWorkspaceProjectsDetailService = (workspaceId) => new Promise(async (resolve, reject) => {
    try {
        const workspace = await db.Workspaces.findOne({
            where: { id: workspaceId }
        });

        if (!workspace) {
            return resolve({
                err: 1,
                msg: 'WORKSPACE NOT FOUND'
            });
        }

        const projects = await db.Project.findAll({
            where: { workspace_id: workspaceId },
            include: [
                {
                    model: db.Users,
                    as: 'leader',
                    attributes: ['id', 'username', 'email']
                },
                {
                    model: db.Project_Member,
                    as: 'members',
                    include: [
                        {
                            model: db.Users,
                            as: 'user',
                            attributes: ['id', 'username', 'email']
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        resolve({
            err: 0,
            msg: 'OK',
            response: projects
        });
    } catch (error) {
        reject(error);
    }
})

// GET WORKSPACE TASKS DETAIL
export const getWorkspaceTasksDetailService = (workspaceId) => new Promise(async (resolve, reject) => {
    try {
        const workspace = await db.Workspaces.findOne({
            where: { id: workspaceId }
        });

        if (!workspace) {
            return resolve({
                err: 1,
                msg: 'WORKSPACE NOT FOUND'
            });
        }

        const allTasks = await db.Task.findAll({
            include: [
                {
                    model: db.Project,
                    as: 'project',
                    where: { workspace_id: workspaceId },
                    required: true,
                    attributes: ['id', 'name']
                },
                {
                    model: db.Users,
                    as: 'assignedUser',
                    attributes: ['id', 'username', 'email']
                }
            ],
            where: { isArchived: false },
            order: [['createdAt', 'DESC']]
        });

        resolve({
            err: 0,
            msg: 'OK',
            response: allTasks
        });
    } catch (error) {
        reject(error);
    }
})

// GET WORKSPACE MEMBERS DETAIL
export const getWorkspaceMembersDetailService = (workspaceId) => new Promise(async (resolve, reject) => {
    try {
        // First, get workspace basic info
        const workspace = await db.Workspaces.findOne({
            where: { id: workspaceId },
            attributes: ['id', 'name', 'description', 'owner_id', 'createdAt']
        });

        if (!workspace) {
            return resolve({
                err: 1,
                msg: 'WORKSPACE NOT FOUND'
            });
        }

        // Get owner separately
        let owner = null;
        if (workspace.owner_id) {
            owner = await db.Users.findOne({
                where: { id: workspace.owner_id },
                attributes: ['id', 'username', 'email']
            });
        }

        // Get workspace members
        const workspaceMembers = await db.Workspace_Members.findAll({
            where: { workspace_id: workspaceId },
            include: [
                {
                    model: db.Users,
                    as: 'user',
                    attributes: ['id', 'username', 'email'],
                    required: false
                }
            ],
            order: [['joined_at', 'DESC']],
            raw: false
        });

        // Map workspace members
        const members = workspaceMembers
            .filter(member => member.user) // Filter out members without user data
            .map(member => ({
                user_id: member.user_id,
                user: {
                    id: member.user.id,
                    username: member.user.username || 'Unknown',
                    email: member.user.email || ''
                },
                role: member.role || 'Developer',
                joined_at: member.joined_at || member.createdAt
            }));

        // Check if owner is already in members list
        const ownerInMembers = owner ? members.some(member => 
            member.user_id === workspace.owner_id
        ) : false;

        // Include owner in members list if not already there
        if (owner && !ownerInMembers) {
            members.unshift({
                user_id: owner.id,
                user: {
                    id: owner.id,
                    username: owner.username || 'Unknown',
                    email: owner.email || ''
                },
                role: 'Owner',
                joined_at: workspace.createdAt
            });
        } else if (owner && ownerInMembers) {
            // If owner is in members, update their role to Owner
            const ownerMemberIndex = members.findIndex(m => m.user_id === workspace.owner_id);
            if (ownerMemberIndex !== -1) {
                members[ownerMemberIndex].role = 'Owner';
            }
        }

        resolve({
            err: 0,
            msg: 'OK',
            response: members
        });
    } catch (error) {
        console.error('Error in getWorkspaceMembersDetailService:', error);
        console.error('Error stack:', error.stack);
        console.error('WorkspaceId:', workspaceId);
        reject(error);
    }
})

// GET WORKSPACE TASKS BY STATUS
export const getWorkspaceTasksByStatusService = (workspaceId, status) => new Promise(async (resolve, reject) => {
    try {
        const workspace = await db.Workspaces.findOne({
            where: { id: workspaceId }
        });

        if (!workspace) {
            return resolve({
                err: 1,
                msg: 'WORKSPACE NOT FOUND'
            });
        }

        const tasks = await db.Task.findAll({
            include: [
                {
                    model: db.Project,
                    as: 'project',
                    where: { workspace_id: workspaceId },
                    required: true,
                    attributes: ['id', 'name']
                },
                {
                    model: db.Users,
                    as: 'assignedUser',
                    attributes: ['id', 'username', 'email']
                }
            ],
            where: { 
                isArchived: false,
                status: status
            },
            order: [['createdAt', 'DESC']]
        });

        resolve({
            err: 0,
            msg: 'OK',
            response: tasks
        });
    } catch (error) {
        reject(error);
    }
})