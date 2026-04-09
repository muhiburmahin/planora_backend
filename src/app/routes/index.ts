import { Router } from "express";
import { CategoryRoutes } from "../module/category/category.route";
import { AuthRoutes } from "../module/auth/auth.route";

const router = Router();

const moduleRoutes = [
    {
        path: "/auth",
        route: AuthRoutes
    },
    {
        path: "/categories",
        route: CategoryRoutes
    }
];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export const IndexRoutes = router;