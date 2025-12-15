/** biome-ignore-all lint/style/useImportType: > */
/** biome-ignore-all lint/correctness/noUnusedFunctionParameters: > */
/** biome-ignore-all assist/source/organizeImports: > */
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import customError from "../shared/customError";
import { verifyJwtToken } from "../helper/jwtHelper";
import { envVars } from "../configs/envVars";
import { prisma } from "../configs/db.config";
import { UserStatus } from "@prisma/client";

export const checkAuth =
  (...authRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.headers.authorization || req.cookies.accessToken;
      if (!accessToken)
        throw new customError(
          StatusCodes.BAD_REQUEST,
          "Access token not found"
        );
      console.log({ accessToken });

      const verifiedToekn = (await verifyJwtToken(
        accessToken,
        envVars.JWT_ACCESS_SECRET as string
      )) as JwtPayload;
      const userExist = await prisma.user.findUnique({
        where: { email: verifiedToekn.email },
      });
      if (!userExist)
        throw new customError(StatusCodes.NOT_FOUND, "User not found");

      if (userExist.status !== UserStatus.ACTIVE) {
        throw new customError(
          StatusCodes.BAD_REQUEST,
          `User is ${userExist.status}`
        );
      }

      if (userExist.isDeleted === true) {
        throw new customError(
          StatusCodes.BAD_REQUEST,
          `User is deleted already`
        );
      }

      req.user = {
        id: verifiedToekn?.userId,
        email: verifiedToekn?.email,
        role: verifiedToekn?.role,
      };

      if (!verifiedToekn)
        throw new customError(StatusCodes.UNAUTHORIZED, "Token is not valid");
      console.log({ verifiedToekn, authRoles });

      if (!authRoles.includes(verifiedToekn.role))
        throw new customError(
          StatusCodes.UNAUTHORIZED,
          "You are not permitted to view this route"
        );

      next();
    } catch (error) {
      next(error);
    }
  };
