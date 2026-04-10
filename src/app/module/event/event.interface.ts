import { EventStatus, EventType } from "../../../generated/prisma";

export type IEventFilterRequest = {
    searchTerm?: string;
    categoryId?: string;
    type?: EventType;
    status?: EventStatus;
    minPrice?: string;
    maxPrice?: string;
};

export type IEvent = {
    title: string;
    slug: string;
    shortDescription?: string;
    description: string;
    date: Date;
    time: string;
    venue: string;
    isOnline: boolean;
    type: EventType;
    registrationFee: number;
    maxParticipants?: number;
    status: EventStatus;
    isPublished: boolean;
    organizerId: string;
    categoryId: string;
};