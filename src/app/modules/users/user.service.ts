/** biome-ignore-all lint/style/useImportType: > */
import { prisma } from "../../configs/db.config";
import { ICreateExplorer } from "./user.interface";

const createExplorer = async (payload:ICreateExplorer) => {
 // travelStylesTags e.g., ["Mountain", "Campigning",]
 // intrests e.g., ["Backpacker", "Luxury", "Budget"]
    // const newexplorer = await prisma.$transaction(async(trans)=>{
    //     const newUser = await trans.
    // })
};

export const userService = {
  createExplorer,
};
