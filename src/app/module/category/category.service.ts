/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../../lib/prisma.js";
import { ICategoryFilterRequest, ICategoryOptions } from "./category.interface.js";


const createCategory = async (data: { name: string; description?: string }) => {
    return await prisma.category.create({ data });
};

const getAllCategories = async (filters: ICategoryFilterRequest, options: ICategoryOptions) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = (Number(page) - 1) * Number(limit);

    const { searchTerm } = filters;
    const andConditions = [];

    if (searchTerm) {
        andConditions.push({
            name: { contains: searchTerm, mode: 'insensitive' as const },
        });
    }

    const whereConditions: any = {
        isDeleted: false,
        ...(andConditions.length > 0 ? { AND: andConditions } : {})
    };

    const result = await prisma.category.findMany({
        where: whereConditions,
        skip,
        take: Number(limit),
        orderBy: { [sortBy]: sortOrder },
    });

    const total = await prisma.category.count({ where: whereConditions });

    return {
        meta: { page: Number(page), limit: Number(limit), total },
        data: result,
    };
};

const updateCategory = async (id: string, data: any) => {
    const isExist = await prisma.category.findFirst({
        where: { id, isDeleted: false }
    });

    if (!isExist) {
        throw new Error("Category not found or already deleted!");
    }

    return await prisma.category.update({
        where: { id },
        data,
    });
};
const deleteCategory = async (id: string) => {
    await prisma.category.findFirstOrThrow({ where: { id, isDeleted: false } });
    return await prisma.category.update({
        where: { id },
        data: { isDeleted: true },
    });
};

export const CategoryService = {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory,
};