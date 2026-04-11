export type IParticipationFilterRequest = {
    searchTerm?: string;
    status?: string;
    paymentStatus?: string;
    eventId?: string;
    userId?: string;
};

export type IParticipationOptions = {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
};