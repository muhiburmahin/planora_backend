import { Request, Response } from 'express';

import httpStatus from 'http-status';
import catchAsync from '../../shared/catchAsync.js';
import { CategoryService } from './category.service.js';
import sendResponse from '../../shared/sendResponse.js';

const createCategory = catchAsync(async (req: Request, res: Response) => {
    const result = await CategoryService.createCategory(req.body);
    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Category created successfully',
        data: result,
    });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
    const filters = { searchTerm: req.query.searchTerm as string };
    const options = {
        limit: Number(req.query.limit) || 10,
        page: Number(req.query.page) || 1,
    };

    const result = await CategoryService.getAllCategories(filters, options);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Categories fetched successfully',
        meta: result.meta,
        data: result.data,
    });
});



const updateCategory = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await CategoryService.updateCategory(id as string, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Category updated successfully',
        data: result,
    });
});

const deleteCategory = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await CategoryService.deleteCategory(id as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Category deleted successfully',
        data: result,
    });
});

export const CategoryController = {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory,
};