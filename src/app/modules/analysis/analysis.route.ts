/** biome-ignore-all assist/source/organizeImports: > */
import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "@prisma/client";
import { AnalysisController } from "./analysis.controller";

const router = Router();

router.get(
  "/explorer",
  checkAuth(Role.EXPLORER),
  AnalysisController.getExplorerAnalysis
);

router.get(
  "/admin",
  checkAuth(Role.ADMIN),
  AnalysisController.getAdminAnalysis
);

export const analysisRouter = router;
