export type ICategoryFilterRequest = {
    searchTerm?: string | undefined;
};

export type ICategoryOptions = {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
};