import cookieParser from "cookie-parser";
import express, { type Application, type Request, type Response } from "express";
import router from "./app/routes/mainRoutes";

const app: Application = express();


// app.use(
//   cors({
//     origin: envVars.FRONTEND_URL as string, // Working well
//     credentials: true,
//   })
// );

//parser
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));


app.use("/api/v1", router)


app.get("/", (_req: Request, res: Response) => {
  res.send("Companion is running...");
});




export default app;
