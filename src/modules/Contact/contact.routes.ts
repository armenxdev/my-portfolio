import { Router } from "express";
import * as ctrl from './contact.ctrl';
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/joi.validate";
import { createContactSchema } from "../../schemas/contact.schema";

const router = Router();

// ==================== PUBLIC ROUTES ====================

router.post("/", validateRequest({ body: createContactSchema }), ctrl.createMessage);

// ==================== ADMIN (PROTECTED) ROUTES ====================

router.use(authenticate, authorize('admin'));

router.get("/", ctrl.getMessages);

router.get("/:id", ctrl.getMessageById);

router.delete("/:id", ctrl.deleteMessage);

export default router;