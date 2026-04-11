import { Router } from "express";
import { CategoryRoutes } from "../module/category/category.route";
import { EventRoutes } from "../module/event/event.route";
import { AuthRoutes } from "../module/auth/auth.route";
import { ParticipationRoutes } from "../module/participation/participation.route";

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
    }

];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export const IndexRoutes = router;