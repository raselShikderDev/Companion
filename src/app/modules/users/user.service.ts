/** biome-ignore-all lint/style/useImportType: > */
/** biome-ignore-all assist/source/organizeImports: > */
import { prisma } from "../../configs/db.config";
import bcrypt from "bcrypt";
import { ICreateAdmin, ICreateExplorer, UpdateProfilePictureInput, UpdateUserProfileInput } from "./user.interface";
import { envVars } from "../../configs/envVars";
import { Gender, Role } from "@prisma/client";
import customError from "../../shared/customError";
import { StatusCodes } from "http-status-codes";




// Create a Explorer
const createExplorer = async (payload: ICreateExplorer) => {

  const { email } = payload

  const existingUser = await prisma.user.findUnique({
    where: {
      email: email,
    }
  })

  if (existingUser?.email) {
    throw new customError(StatusCodes.BAD_REQUEST, "Explorer already exists! Please use another email")
  }

  return prisma.$transaction(async (tx) => {
    const hashedPassword = await bcrypt.hash(payload.password, Number(envVars.BCRYPT_SALT_ROUND as string));

    // 1️⃣ Create user
    const user = await tx.user.create({
      data: {
        email: payload.email,
        password: hashedPassword,
        role: Role.EXPLORER,
      },
    });
    console.log({ user });

    // 2️⃣ Create explorer profile
    const explorer = await tx.explorer.create({
      data: {
        userId: user.id,
        fullName: payload.explorer.fullName,
        phone: payload.explorer.phone,
        gender: payload.explorer.gender as Gender,
        profilePicture: payload.explorer.profilePicture || null,
      },
    });

    return { explorer };
  });
};

// http://localhost:5000/api/v1/users/create-explorer
// {
//   "email": "explorer1@test.com",
//   "password": "SecurePass123!",
//   "explorer": {
//     "fullName": "John Explorer",
//     "phone": "01712345678",
//     "gender": "MALE",
//     "profilePicture": "https://example.com/pic.jpg"
//   }
// }

// Create admin
 const createAdmin = async (payload: ICreateAdmin) => {
  const { email } = payload;
  console.log({ payload });

  // Check if admin already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser?.email) {
    throw new customError(
      StatusCodes.BAD_REQUEST,
      "Admin already exists! Please use another email"
    );
  }

  // Run transaction to create user + admin
  return prisma.$transaction(async (tx) => {
    const hashedPassword = await bcrypt.hash(
      payload.password,
      Number(envVars.BCRYPT_SALT_ROUND)
    );

    // Create User
    const user = await tx.user.create({
      data: {
        email: payload.email,
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });

    // Create Admin Profile
    const admin = await tx.admin.create({
      data: {
        userId: user.id,
        fullName: payload.admin.fullName,
        phone: payload.admin.phone,
        profilePicture: payload.admin.profilePicture || null,
      },
    });

    return { admin };
  });
};

// http://localhost:5000/api/v1/users/create-admin
// {
//   "email": "admin@example.com",
//   "password": "Admin123#",
//   "admin": {
//     "fullName": "Super Admin",
//     "phone": "+8801700000001",
//     "profilePicture": "https://example.com/profiles/super_admin.jpg"
//   }
// }


const updateProfilePicture = async (
  userId: string,
  data: UpdateProfilePictureInput
)  => {

   const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { explorers: true, admins: true },
  });

  if (!user) throw new customError(StatusCodes.NOT_FOUND, "User not found");

  // Identify target model based on role
  const target =
    user.role === "ADMIN"
      ? user.admins[0]
      : user.explorers[0];

  if (!target)
    throw new customError(StatusCodes.NOT_FOUND, "Profile not found");

  // Update inside transaction
  const updated = await prisma.$transaction(async (tx) => {
    if (user.role === "ADMIN") {
      return await tx.admin.update({
        where: { id: target.id },
        data: { profilePicture: data.profilePicture },
      });
    } else {
      return await tx.explorer.update({
        where: { id: target.id },
        data: { profilePicture: data.profilePicture },
      });
    }
  });

  return updated;
};

const updateUserProfile = async (
  userId: string,
  data: UpdateUserProfileInput
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { explorers: true, admins: true },
  });

  if (!user) throw new customError(StatusCodes.NOT_FOUND, "User not found");

  // Role based profile
  const target =
    user.role === "ADMIN"
      ? user.admins[0]
      : user.explorers[0];

  if (!target)
    throw new customError(StatusCodes.NOT_FOUND, "Profile not found");

  // Never update email or password here  
  const allowedData = { ...data };

  const updated = await prisma.$transaction(async (tx) => {
    if (user.role === "ADMIN") {
      return tx.admin.update({
        where: { id: target.id },
        data: allowedData,
      });
    } else {
      return tx.explorer.update({
        where: { id: target.id },
        data: allowedData,
      });
    }
  });

  return updated;
};

const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    include: {
      explorers: true,
      admins: true,
    },
  });

  return users.map(safeUser);
};

const getSingleUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      explorers: true,
      admins: true,
    },
  });

  if (!user) {
    throw new customError(StatusCodes.NOT_FOUND, "User not found");
  }

  return safeUser(user);
};

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      explorers: true,
      admins: true,
    },
  });

  if (!user) {
    throw new customError(StatusCodes.NOT_FOUND, "User not found");
  }

  return user;
};


export const userService = {
  createExplorer,
  createAdmin,
  updateProfilePicture,
  updateUserProfile,
  getAllUsers,
  getSingleUser,
  getMe,
};


