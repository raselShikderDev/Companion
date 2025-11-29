/** biome-ignore-all assist/source/organizeImports: <explanation> */
import express, { type Application, type Request, type Response } from "express";
import cookieParser from "cookie-parser";

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





app.get("/", (_req: Request, res: Response) => {
  res.send("health Care is running..");
});




export default app;
