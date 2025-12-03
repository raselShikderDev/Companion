
import { Role } from "@prisma/client";
import express from "express";


type User = {
    id: string;
    email: string
    role: Role
};



declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}
