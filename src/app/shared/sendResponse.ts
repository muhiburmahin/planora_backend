import { Response } from 'express';

type IResponse<T> = {
    statusCode: number;
    success: boolean;
    message?: string | null;
    meta?: {
        page: number;
        limit: number;
        total: number;
    };
    data: T;
};

const sendResponse = <T>(res: Response, data: IResponse<T>) => {
    res.status(data.statusCode).json({
        success: data.success,
        message: data.message || 'Success',
        meta: data.meta || null,
        data: data.data,
    });
};

export default sendResponse;