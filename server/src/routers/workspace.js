import express from 'express';
import * as controllers from '../controllers/workspace'

//CRUD
const router = express.Router();
router.post('/create',controllers.createWorkspace);
router.post('/list-workspace-by-user',controllers.listWorkspaceByUser);
router.get('/get-by-id/:id/projects',controllers.getWorkspaceById);
router.post('/:workspaceId/add-member',controllers.addMemberToWorkspace);
router.delete('/:workspaceId/remove-member/:userId',controllers.removeMemberFromWorkspace);
router.get('/:workspaceId/stats',controllers.getWorkspaceStats);
router.get('/:workspaceId/projects-detail',controllers.getWorkspaceProjectsDetail);
router.get('/:workspaceId/tasks-detail',controllers.getWorkspaceTasksDetail);
router.get('/:workspaceId/members-detail',controllers.getWorkspaceMembersDetail);
router.get('/:workspaceId/tasks-by-status/:status',controllers.getWorkspaceTasksByStatus);
// router.get('/get-workspace-by-id',controllers.getWorkspaceById);
// router.put('/update',controllers.updateWorkspace);
// router.delete('/delete',controllers.deleteWorkspace);
// router.get('/all',controllers.getAllWorkspaces);       

export default router;