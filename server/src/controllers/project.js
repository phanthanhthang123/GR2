import * as services from '../services/project';

export const getAllProjects = async (req,res)=>{
    try {
        const respone = await services.getAllProjectsService();
        // console.log(respone);
        return res.status(200).json(respone);
    } catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at get project controller: ' + error
        })
    }
}

export const getProjectById = async (req,res)=>{
    try {
        // console.log(req.query);
        const {id} = req.query;
        const respone = await services.getProjectByIdService(id);
        return res.status(200).json(respone);
    } catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at get project by id controller: ' + error
        })
    }
}

export const createProject = async (req,res)=>{
    try {
        const {workspaceId} = req.params;
        const {created_by, ...projectData} = req.body;
        
        if(!workspaceId) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: workspaceId'
            })
        }

        if(!projectData.name || !projectData.startDate || !projectData.dueDate) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameters: name, startDate, dueDate'
            })
        }

        if(!created_by) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: created_by'
            })
        }

        const response = await services.createProjectService(workspaceId, projectData, created_by);
        if(response.err === 1) {
            return res.status(400).json(response);
        }
        return res.status(201).json(response);
    } catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at create project controller: ' + error
        })
    }
}

export const getProjectTasks = async (req,res)=>{
    try {
        const {projectId} = req.params;
        if(!projectId) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: projectId'
            })
        }
        const respone = await services.getProjectTasksService(projectId);
        return res.status(200).json(respone);
    } catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at get project tasks controller: ' + error
        })
    }
}