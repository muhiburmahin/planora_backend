import { Router } from "express";
import auth, { optionalAuth } from "../../middleware/auth";
import validateRequest from "../../middleware/validateRequest";
import { EventController } from "./event.controller";
import { EventValidations } from "./event.validation";
import { upload } from "../../middleware/multer";


const router = Router();

router.post(
    "/create-event",
    auth("USER", "ADMIN"),
    (req, res, next) => {
        upload.array("images", 5)(req, res, (err) => {
            if (err) {
                return next(err);
            }
            next();
        });
    },
    validateRequest(EventValidations.createEvent),
    EventController.createEvent
);

router.get("/", optionalAuth, EventController.getAllEvents);
router.get("/:id", EventController.getSingleEvent);

router.patch(
    "/:id",
    auth("USER", "ADMIN"),
    (req, res, next) => {
        upload.array("images", 5)(req, res, (err) => {
            if (err) {
                return next(err);
            }
            next();
        });
    },
    validateRequest(EventValidations.updateEvent),
    EventController.updateEvent
);

router.delete("/:id", auth("USER", "ADMIN"), EventController.deleteEvent);

export const EventRoutes = router;