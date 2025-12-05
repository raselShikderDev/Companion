/** biome-ignore-all assist/source/organizeImports: > */
import { Router } from "express";
import { userRouter } from "../modules/users/users.route";
import { authRouter } from "../modules/auth/auth.route";
import { tripRouter } from "../modules/trip/trip.route";
import { matchRouter } from "../modules/match/match.routes";
import { emailRouter } from "../modules/email/email.router";
import { subscriptionRouter } from "../modules/subscription/subscription.routes";
import { ReviewRouter } from "../modules/review/review.route";


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
    {
        path:"/match",
        route:matchRouter
    },
    {
        path:"/email",
        route:emailRouter
    },
    {
        path:"/subscription",
        route:subscriptionRouter
    },
    {
        path:"/review",
        route:ReviewRouter
    },
]

// biome-ignore lint/suspicious/useIterableCallbackReturn: using to bypass the error
routerModules.forEach((route)=> router.use(route.path, route.route))



export default router