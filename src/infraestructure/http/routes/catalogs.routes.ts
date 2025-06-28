import { Router } from "express";
import modulesRoutes from "./modules.routes";

const router = Router();

router
    .use('/modules', modulesRoutes);

export default router;