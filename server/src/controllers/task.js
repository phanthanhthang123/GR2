import * as services from '../services/task';

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