import { Router } from "express";
import auth from "../../middleware/auth";
import validateRequest from "../../middleware/validateRequest";
import { EventController } from "./event.controller";
import { EventValidations } from "./event.validation";
import { upload } from "../../shared/upload.utils";

const router = Router();

router.post(
    "/create-event",
    auth("USER", "ADMIN"),
    upload.array("images", 5),
    validateRequest(EventValidations.createEvent),
    EventController.createEvent
);

router.get("/", EventController.getAllEvents);
router.get("/:id", EventController.getSingleEvent);

router.patch(
    "/:id",
    auth("USER", "ADMIN"),
    validateRequest(EventValidations.updateEvent),
    EventController.updateEvent
);

router.delete("/:id", auth("USER", "ADMIN"), EventController.deleteEvent);

export const EventRoutes = router;