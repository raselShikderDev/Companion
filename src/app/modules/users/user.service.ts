/** biome-ignore-all lint/style/useImportType: > */
import { ICreateExplorer } from "./user.interface";

const createExplorer = async (payload:ICreateExplorer) => {
  console.log(payload);
};

export const userService = {
  createExplorer,
};
