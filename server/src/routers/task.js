import express from 'express';
import * as controllers from '../controllers/task'

//CRUD
const router = express.Router();
router.post('/:projectId/create-task',controllers.createTask);
export default router;