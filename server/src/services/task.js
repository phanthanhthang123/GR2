import db from '../models';
import { v4 } from 'uuid';  

//CREATE TASK
export const createTaskService = (projectId, taskData) => new Promise(async (resolve, reject) => {
    try {
        const taskId = v4();
        // Handle assignees - if it's an array, take the first one (or you can create a separate Task_Assignees table for multiple assignees)
        const assignedTo = Array.isArray(taskData.assignees) && taskData.assignees.length > 0 
            ? taskData.assignees[0] 
            : taskData.assignees;
        
        const task = await db.Task.create({
            id: taskId,
            project_id: projectId,
            assigned_to: assignedTo,
            title: taskData.title,
            description: taskData.description,
            status: taskData.status,
            priority: taskData.priority || 'Medium',
            dueDate : taskData.dueDate,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        if(!task) {
            return resolve({
                err: 1,
                msg: 'FAILED TO CREATE TASK'
            });
        }

        resolve({
            err: 0,
            msg: 'OK',
            response: task,
            project: projectId
        });
    } catch (error) {
        resolve({
            err: 1,
            msg: 'FAILED TO CREATE TASK: ' + error.message
        });
    }
});