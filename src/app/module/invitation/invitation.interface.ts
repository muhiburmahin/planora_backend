export type IInvitationFilterRequest = {
    searchTerm?: string | undefined;
    status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | undefined;
    eventId?: string | undefined;
};

export type IInvitationOptions = {
    limit?: number;
    page?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
};

export type IInvitationPayload = {
    eventId: string;
    receiverId: string;
    message?: string;
};