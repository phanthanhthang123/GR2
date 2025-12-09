import db from '../models';
import { v4 } from 'uuid';

//GET ALL PROJECTS
export const getAllProjectsService = () => new Promise(async (resolve, reject) => {
    try {
        const response = await db.Project.findAll({
            raw: true,
            // attributes : ['id','name','description']
        });
        resolve({
            err: response ? 0 : 1,
            msg: response ? 'OK' : 'FAILED TO GET ALL PROJECTS',
            response
        });
    } catch (error) {
        reject(error);
    }
});

export const getProjectByIdService = (id)=> new Promise(async (resolve, reject)=>{
    try {
        const response = await db.Project.findOne({
            raw: true,
            attributes : ['id','name','description'],
            where: {
                id
            }
        });
        resolve({
            err: response ? 0 : 1,
            msg: response ? 'OK' : 'FAILED TO GET PROJECT BY ID',
            response
        });
    } catch (error) {
        reject(error);
    }
})

// CREATE PROJECT
export const createProjectService = (workspaceId, projectData, createdBy) => new Promise(async (resolve, reject) => {
    const transaction = await db.sequelize.transaction();
    try {
        // Map client roles to database roles
        const roleMapping = {
            'Admin': 'Leader',
            'Leader': 'Leader',
            'member': 'Developer'
        };

        // Convert status from client format to database format
        const statusMapping = {
            'Pending': 'Pending',
            'In Progress': 'In Progress',
            'Completed': 'Completed'
        };

        // Generate project ID
        const projectId = v4();

        // Find leader_id from members if provided, otherwise use createdBy
        let leaderId = createdBy;
        if (projectData.members && projectData.members.length > 0) {
            const leaderMember = projectData.members.find(m => m.role === 'Leader' || m.role === 'Admin');
            if (leaderMember) {
                leaderId = leaderMember.user;
            }
        }

        // Create project
        const project = await db.Project.create({
            id: projectId,
            workspace_id: workspaceId,
            name: projectData.name,
            description: projectData.description || null,
            start_date: new Date(projectData.startDate),
            end_date: new Date(projectData.dueDate),
            status: statusMapping[projectData.status] || 'Pending',
            leader_id: leaderId,
            created_by: createdBy,
            createdAt: new Date(),
            updatedAt: new Date()
        }, { transaction });

        // Create project members if provided
        if (projectData.members && projectData.members.length > 0) {
            const memberPromises = projectData.members.map(member => {
                const dbRole = roleMapping[member.role] || 'Developer';
                return db.Project_Member.create({
                    id: v4(),
                    project_id: projectId,
                    user_id: member.user,
                    role: dbRole,
                    joined_at: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                }, { transaction });
            });
            await Promise.all(memberPromises);
        } else {
            // If no members provided, add creator as Leader
            await db.Project_Member.create({
                id: v4(),
                project_id: projectId,
                user_id: createdBy,
                role: 'Leader',
                joined_at: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            }, { transaction });
        }

        await transaction.commit();

        // Fetch the created project with relations
        const createdProject = await db.Project.findOne({
            where: { id: projectId },
            include: [
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
                },
                {
                    model: db.Workspaces,
                    as: 'workspace',
                    attributes: ['id', 'name']
                }
            ]
        });

        resolve({
            err: 0,
            msg: 'OK',
            response: createdProject,
            workspaceId: workspaceId
        });
    } catch (error) {
        await transaction.rollback();
        reject(error);
    }
});

//GET PROJECT


export const getProjectTasksService = async (projectId, userId) => {
    try {

        // Lấy project
        const project = await db.Project.findOne({
            where: { id: projectId },
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
            ]
        });

        if (!project) {
            return { err: 1, msg: "Project not found" };
        }

        // Check if user is a project member
        if (userId) {
            const isMember = project.members?.some((member) => {
                const memberUserId = typeof member.user === 'string' ? member.user : member.user?.id || member.user_id;
                return memberUserId === userId;
            }) || project.leader_id === userId || project.created_by === userId;

            if (!isMember) {
                return { 
                    err: 1, 
                    msg: "Bạn không phải là thành viên trong project này",
                    code: "NOT_PROJECT_MEMBER"
                };
            }
        }

        // Lấy tasks
        const tasks = await db.Task.findAll({
            where: { project_id: projectId },
            include: [
                {
                    model: db.Users,
                    as: 'assignedUser',
                    attributes: ['id', 'username', 'email']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        return {
            err: 0,
            msg: 'OK',
            project,
            tasks // luôn có mảng (dù rỗng)
        };

    } catch (error) {
        return {
            err: -1,
            msg: `Failed at get project detail: ${error}`
        };
    }
};
