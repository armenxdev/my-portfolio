import {Router} from "express";
import {logger} from "../utils/logger";
import authRoutes from "../modules/auth/auth.routes";
import postsRoutes from "../modules/Posts/posts.routes";
import contactRoutes from "../modules/Contact/contact.routes";

const router = Router();

router.use('/v1/posts', postsRoutes);
router.use('/v1/auth', authRoutes);
router.use('/v1/contact', contactRoutes);

router.get('/health', (req, res) => {
    logger.debug('Health check endpoint hit');
    res.status(200).json({ status: 'OK' });
});

export default router;