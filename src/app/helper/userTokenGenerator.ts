/** biome-ignore-all assist/source/organizeImports: <> */
/** biome-ignore-all lint/style/useImportType: <> */
import { envVars } from "../configs/envVars";
import { User } from "@prisma/client";
import { generateJwtToken } from "./jwtHelper";


export const createUserToken = async (user: Partial<User>) => {
  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  

  // generating token by utils function
  const accessToken = await generateJwtToken(
    jwtPayload,
    envVars.JWT_ACCESS_SECRET as string,
    envVars.JWT_ACCESS_EXPIRES as string
  );

  // generating refresh token by utils function
  const refreshToken = await generateJwtToken(
    jwtPayload,
    envVars.JWT_REFRESH_SECRET as string,
    envVars.JWT_REFRESH_EXPIRES as string
  );
  return {
    accessToken,
    refreshToken,
  };
};