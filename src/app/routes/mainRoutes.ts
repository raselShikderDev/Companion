/** biome-ignore-all assist/source/organizeImports: > */
import { Router } from "express";
import { userRouter } from "../modules/users/users.route";
import { authRouter } from "../modules/auth/auth.route";
import { tripRouter } from "../modules/trip/trip.route";


const router = Router()

const routerModules = [
    {
        path:"/users",
        route:userRouter
    },
    {
        path:"/auth",
        route:authRouter
    },
    {
        path:"/trip",
        route:tripRouter
    },
]

// biome-ignore lint/suspicious/useIterableCallbackReturn: using to bypass the error
routerModules.forEach((route)=> router.use(route.path, route.route))



export default router