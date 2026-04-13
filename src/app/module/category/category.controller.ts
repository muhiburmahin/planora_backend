import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../shared/catchAsync';
import { CategoryService } from './category.service';
import sendResponse from '../../shared/sendResponse';

const createCategory = catchAsync(async (req: Request, res: Response) => {
    if (req.file) {
        req.body.icon = req.file.path;
    }

    const result = await CategoryService.createCategory(req.body);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Category created successfully',
        data: result,
    });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
    const filters = {
        searchTerm: req.query.searchTerm as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined
    };
    const options = {
        limit: Number(req.query.limit) || 10,
        page: Number(req.query.page) || 1,
    };

    const result = await CategoryService.getAllCategories(filters, options);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Categories fetched successfully',
        meta: result.meta,
        data: result.data,
    });
});

const getSingleCategory = catchAsync(async (req: Request, res: Response) => {
    const { slug } = req.params;
    const result = await CategoryService.getSingleCategory(slug as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Category fetched successfully',
        data: result,
    });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (req.file) {
        req.body.icon = req.file.path;
    }

    const result = await CategoryService.updateCategory(id as string, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Category updated successfully',
        data: result,
    });
});

const toggleCategoryStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await CategoryService.toggleCategoryStatus(id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Category status toggled successfully',
        data: result,
    });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
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
    getSingleCategory,
    updateCategory,
    toggleCategoryStatus,
    deleteCategory,
};