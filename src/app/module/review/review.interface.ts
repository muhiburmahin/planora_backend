export interface IReviewPayload {
    eventId: string;
    rating: number;
    comment: string;
}

export interface IReviewUpdatePayload {
    rating?: number;
    comment?: string;
}
export interface IReviewFilterRequest {
    searchTerm?: string;
    rating?: string;
    userId?: string;
    eventId?: string;
}

export interface IReviewOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}