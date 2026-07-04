import { Router } from "express";
import * as ctrl from './posts.ctrl';
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/joi.validate";
import { createPostSchema, updatePostSchema, postQuerySchema } from "../../schemas/posts.schema";

const router = Router();

// ==================== PUBLIC ROUTES ====================

router.get("/", /*validateRequest({ query: postQuerySchema }),*/ ctrl.getPublicPosts);

router.get("/tags/all", ctrl.getAllTags);

router.get("/:slug", ctrl.getPostBySlug);

// ==================== ADMIN (PROTECTED) ROUTES ====================
router.use(authenticate, authorize('admin'));

router.post("/", validateRequest({ body: createPostSchema }), ctrl.createPost);

router.put("/:slug", validateRequest({ body: updatePostSchema }), ctrl.editPost);

router.delete("/:slug", ctrl.deletePost);

export default router;