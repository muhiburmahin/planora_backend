import express from 'express';
import validateRequest from '../../middleware/validateRequest';
import { CategoryController } from './category.controller';
import { CategoryValidation } from './category.validation';
import auth from '../../middleware/auth';
import { Role } from '../../../generated/prisma/client';
import { upload } from '../../middleware/multer';

const router = express.Router();

router.get('/', CategoryController.getAllCategories);
router.get('/:slug', CategoryController.getSingleCategory);

router.post(
    '/create-category',
    auth(Role.ADMIN),
    upload.single('icon'),
    validateRequest(CategoryValidation.createCategory),
    CategoryController.createCategory
);

router.patch(
    '/:id',
    auth(Role.ADMIN),
    upload.single('icon'),
    validateRequest(CategoryValidation.updateCategory),
    CategoryController.updateCategory
);

router.patch(
    '/:id/toggle-status',
    auth(Role.ADMIN),
    CategoryController.toggleCategoryStatus
);

router.delete('/:id', auth(Role.ADMIN), CategoryController.deleteCategory);

export const CategoryRoutes = router;