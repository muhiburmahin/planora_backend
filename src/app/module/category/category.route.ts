import express from 'express';
import validateRequest from '../../middleware/validateRequest';
import { CategoryController } from './category.controller';
import { CategoryValidation } from './category.validation';

const router = express.Router();

router.get('/', CategoryController.getAllCategories);

router.post(
    '/create-category',
    validateRequest(CategoryValidation.createCategory),
    CategoryController.createCategory
);

router.patch(
    '/:id',
    validateRequest(CategoryValidation.updateCategory),
    CategoryController.updateCategory
);

router.delete('/:id', CategoryController.deleteCategory);

export const CategoryRoutes = router;