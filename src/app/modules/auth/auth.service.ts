/** biome-ignore-all assist/source/organizeImports: > */
import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../../configs/db.config";
import customError from "../../shared/customError";
import { UserStatus } from "@prisma/client";
import { createUserToken } from "../../helper/userTokenGenerator";

const login = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new customError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (user.isDeleted) {
    throw new customError(StatusCodes.FORBIDDEN, "Account removed");
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new customError(StatusCodes.FORBIDDEN, `Account is ${user.status}`);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new customError(
      StatusCodes.UNAUTHORIZED,
      "Invalid email or password"
    );
  }

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const userTokens = createUserToken(payload);

  return userTokens;
};

export const authService = {
  login,
};
