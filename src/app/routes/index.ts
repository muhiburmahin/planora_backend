import { Router } from "express";
import { CategoryRoutes } from "../module/category/category.route";


const router = Router();

const moduleRoutes = [
    {
        path: "/categories",
        route: CategoryRoutes
    }
];

moduleRoutes.forEach(route => router.use(route.path, route.route));

export const IndexRoutes = router;