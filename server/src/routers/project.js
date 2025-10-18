import express from 'express';
import * as controllers from '../controllers/project'

//CRUD
const router = express.Router();
router.get('/all',controllers.getAllProjects);
router.get('/',controllers.getProjectById);       

export default router;