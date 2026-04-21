import express from 'express';
import { AuthController } from './auth.controller';
import authMiddleware from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { AuthValidation } from './auth.validation';

const router = express.Router();

// Public Routes
router.post(
    '/register',
    validateRequest(AuthValidation.registerValidationSchema),
    AuthController.registerUser
);

router.post(
    '/login',
    validateRequest(AuthValidation.loginValidationSchema),
    AuthController.loginUser
);

router.post('/refresh-token', AuthController.getNewToken);

// Email Verification (GET method is industry standard for links)
router.get('/verify-email/:token', AuthController.verifyEmail);

// Password Management
router.post('/forget-password', AuthController.forgetPassword);
router.post('/reset-password', AuthController.resetPassword);

// Authenticated Routes
router.get(
    '/me',
    authMiddleware('ADMIN', 'USER'),
    AuthController.getMe
);

router.post(
    '/change-password',
    authMiddleware('ADMIN', 'USER'),
    AuthController.changePassword
);

// Logout should be callable even if the client does not have a valid access token
router.post('/logout', AuthController.logoutUser);


router.get("/login/google",
    AuthController.googleLogin
);
router.get("/google/success",
    AuthController.googleLoginSuccess
);
router.get("/oauth/error",
    AuthController.handleOAuthError
);

export const AuthRoutes = router;