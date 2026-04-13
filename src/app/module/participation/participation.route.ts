import { Router } from "express";
import auth from "../../middleware/auth";
import validateRequest from "../../middleware/validateRequest";
import { ParticipationController } from "./participation.controller";
import { ParticipationValidations } from "./participation.validation";
import { Role } from "../../../generated/prisma";


const router = Router();

router.post(
    "/join",
    auth(Role.USER, Role.ADMIN),
    validateRequest(ParticipationValidations.createParticipation),
    ParticipationController.joinEvent
);

router.get(
    "/my-participations",
    auth(Role.USER, Role.ADMIN),
    ParticipationController.getMyParticipations
);

router.get(
    "/",
    auth(Role.ADMIN),
    ParticipationController.getAllParticipations
);

router.get(
    "/:id",
    auth(Role.ADMIN, Role.USER),
    ParticipationController.getSingleParticipation
);

router.patch(
    "/:id/status",
    auth(Role.ADMIN, Role.USER),
    validateRequest(ParticipationValidations.updateStatus),
    ParticipationController.updateStatus
);

router.delete(
    "/:id",
    auth(Role.USER, Role.ADMIN),
    ParticipationController.cancelParticipation
);

export const ParticipationRoutes = router;