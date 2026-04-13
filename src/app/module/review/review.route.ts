import express from 'express';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { ReviewController } from './review.controller';
import { ReviewValidations } from './review.validation';
import { Role } from '../../../generated/prisma';

const router = express.Router();

router.post(
    '/',
    auth(Role.USER),
    validateRequest(ReviewValidations.createReview),
    ReviewController.createReview
);


router.get(
    '/:eventId', 
    ReviewController.getEventReviews
);

router.get(
    '/stats/:eventId', 
    ReviewController.getReviewStats
);

router.get(
    '/my-reviews', 
    auth(Role.USER), 
    ReviewController.getMyReviews
);



router.patch(
    '/:id',
    auth(Role.USER),
    validateRequest(ReviewValidations.updateReview),
    ReviewController.updateReview
);

router.delete(
    '/:id', 
    auth(Role.USER), 
    ReviewController.deleteReview
);


router.delete(
    '/admin/:id', 
    auth(Role.ADMIN), 
    ReviewController.deleteReviewByAdmin
);

export const ReviewRoutes = router;