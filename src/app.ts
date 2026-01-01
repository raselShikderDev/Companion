/** biome-ignore-all assist/source/organizeImports: > */
import cookieParser from "cookie-parser";
import cors from "cors"
import express, { type Application, type Request, type Response } from "express";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandlers";
import notFound from "./app/middlewares/notFound";
import { envVars } from "./app/configs/envVars";
import router from "./app/routes/mainRoutes";

const app: Application = express();


app.use(
  cors({
    origin: envVars.FRONEND_URL as string, 
    credentials: true,
  })
);
app.set("trust proxy", 1)
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));


app.use("/api/v1", router)


app.get("/", (_req: Request, res: Response) => {
  res.send("Companion is running...");
});


app.use(globalErrorHandler)
app.use(notFound)

export default app;
