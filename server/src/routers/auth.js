import express from 'express';
import * as controllers from '../controllers/auth'

//CRUD
const router = express.Router();
router.post('/register', controllers.register);
router.post('/login', controllers.login);
router.post('/logout', controllers.logout);
router.post('/edit-password', controllers.editPassword);
router.post('/forgot-password', controllers.forgotPassword);
router.post('/reset-password', controllers.resetPassword);
// router.post('/send-reset-password-email', controllers.sendResetPasswordEmail);
// router.post('/verify-email', controllers.verifyEmail);
export default router;