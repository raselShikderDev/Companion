import { Router } from "express";
import { userRouter } from "../modules/users/users.route";


const router = Router()

const routerModules = [
    {
        path:"/users",
        route:userRouter
    }
]

// biome-ignore lint/suspicious/useIterableCallbackReturn: using to bypass the error
routerModules.forEach((route)=> router.use(route.path, route.route))



export default router