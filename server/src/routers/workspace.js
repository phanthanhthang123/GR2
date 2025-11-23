import express from 'express';
import * as controllers from '../controllers/workspace'

//CRUD
const router = express.Router();
router.post('/create',controllers.createWorkspace);
router.post('/list-workspace-by-user',controllers.listWorkspaceByUser);
router.get('/get-by-id/:id/projects',controllers.getWorkspaceById);
// router.get('/get-workspace-by-id',controllers.getWorkspaceById);
// router.put('/update',controllers.updateWorkspace);
// router.delete('/delete',controllers.deleteWorkspace);
// router.get('/all',controllers.getAllWorkspaces);       

export default router;