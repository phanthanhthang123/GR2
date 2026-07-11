import express from 'express';
import * as controllers from '../controllers/github';

const router = express.Router();

router.put('/user-profile', controllers.updateGithubUsername);
router.post('/sync', controllers.syncGithubProject);
router.post('/webhook', controllers.handleWebhook);

export default router;
