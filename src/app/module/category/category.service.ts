/* eslint-disable @typescript-eslint/no-explicit-any */
import slugify from 'slugify';
import { prisma } from '../../lib/prisma';
import AppError from '../../errorHelpers/appError';
import httpStatus from 'http-status';

const createCategory = async (payload: any) => {
    const isExist = await prisma.category.findFirst({
        where: { name: { equals: payload.name, mode: 'insensitive' }, isDeleted: false }
    });
    if (isExist) throw new AppError(httpStatus.CONFLICT, "Category already exists!");

    let slug = slugify(payload.name, { lower: true, strict: true });
    const isSlugExist = await prisma.category.findUnique({ where: { slug } });

    if (isSlugExist) {
        slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    payload.slug = slug;

    return await prisma.category.create({ data: payload });
};

const getAllCategories = async (filters: any, options: any) => {
    const { searchTerm, isActive } = filters;
    const { limit, page } = options;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };

    if (searchTerm) {
        where.OR = [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { slug: { contains: searchTerm, mode: 'insensitive' } },
        ];
    }

    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
        prisma.category.findMany({
            where,
            skip,
            take: limit,
            orderBy: { name: 'asc' },
            include: {
                _count: { select: { events: true } }
            }
        }),
        prisma.category.count({ where }),
    ]);

    return {
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        data,
    };
};

const getSingleCategory = async (slug: string) => {
    const result = await prisma.category.findUnique({
        where: { slug, isDeleted: false },
        include: {
            _count: { select: { events: true } }
        }
    });
    if (!result) throw new AppError(httpStatus.NOT_FOUND, "Category not found!");
    return result;
};

const updateCategory = async (id: string, payload: any) => {
    const isExist = await prisma.category.findUnique({ where: { id } });
    if (!isExist) throw new AppError(httpStatus.NOT_FOUND, "Category not found!");

    if (payload.name) {
        payload.slug = slugify(payload.name, { lower: true, strict: true });
    }

    return await prisma.category.update({
        where: { id },
        data: payload,
    });
};

const toggleCategoryStatus = async (id: string) => {
    const isExist = await prisma.category.findUnique({ where: { id } });
    if (!isExist) throw new AppError(httpStatus.NOT_FOUND, "Category not found!");

    return await prisma.category.update({
        where: { id },
        data: { isActive: !isExist.isActive }
    });
};

const deleteCategory = async (id: string) => {
    // ক্যাটাগরিতে ইভেন্ট থাকলে ডিলিট করতে বাধা দেওয়া (Industry Standard)
    const eventCount = await prisma.event.count({
        where: { categoryId: id, isDeleted: false }
    });

    if (eventCount > 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "Cannot delete category while it has active events!");
    }

    return await prisma.category.update({
        where: { id },
        data: { isDeleted: true },
    });
};

export const CategoryService = {
    createCategory,
    getAllCategories,
    getSingleCategory,
    updateCategory,
    toggleCategoryStatus,
    deleteCategory,
};