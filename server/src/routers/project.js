import express from 'express';
import * as controllers from '../controllers/project'

//CRUD
const router = express.Router();
router.get('/all',controllers.getAllProjects);
router.get('/',controllers.getProjectById);
router.post('/:workspaceId/create-project',controllers.createProject);       
router.get('/:projectId/tasks',controllers.getProjectTasks);
export default router;