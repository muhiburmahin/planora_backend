import { Router } from "express";
import { CategoryRoutes } from "../module/category/category.route";
import { EventRoutes } from "../module/event/event.route";
import { AuthRoutes } from "../module/auth/auth.route";
import { ParticipationRoutes } from "../module/participation/participation.route";
import { NotificationRoutes } from "../module/notification/notification.route";
import { InvitationRoutes } from "../module/invitation/invitation.route";
import { ReviewRoutes } from "../module/review/review.route";

const router = Router();

const moduleRoutes = [
    {
        path: "/auth",
        route: AuthRoutes
    },
    {
        path: "/events",
        route: EventRoutes
    },
    {
        path: "/categories",
        route: CategoryRoutes
    },
    {
        path: "/participations",
        route: ParticipationRoutes
    },
    {
        path: "/notifications",
        route: NotificationRoutes
    },
    {
        path: "/invitations",
        route: InvitationRoutes
    },
    {
        path: "/reviews",
        route: ReviewRoutes
    }


];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export const IndexRoutes = router;