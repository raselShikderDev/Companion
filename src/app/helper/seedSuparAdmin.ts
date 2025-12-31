/** biome-ignore-all assist/source/organizeImports: > */
import { Role, UserStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import { envVars } from "../configs/envVars";
import { prisma } from "../configs/db.config";



async function seedSuperAdmin() {

    const existingSuperAdmin = await prisma.user.findUnique({
        where: {
            email: envVars.SUPER_ADMIN_EMAIL as string,
            role: Role.SUPER_ADMIN
        }
    })

    if (existingSuperAdmin?.email && existingSuperAdmin.role === Role.SUPER_ADMIN) {
        console.log("Super admin exists")
        return
    }

    try {
        console.log("Creating super admin")
        const hashedPassword = await bcrypt.hash(envVars.SUPER_ADMIN_PASSWORD as string, Number(envVars.BCRYPT_SALT_ROUND as string));

        const result = await prisma.$transaction(async (tx) => {
            // Create User
            const user = await tx.user.create({
                data: {
                    email: envVars.SUPER_ADMIN_EMAIL as string,
                    password: hashedPassword,
                    role: Role.SUPER_ADMIN,
                    status: UserStatus.ACTIVE,
                },
            });

            // Create Admin profile linked with userId
            const admin = await tx.admin.create({
                data: {
                    userId: user.id,
                    fullName: "Super Admin",
                    phone: "+8801700000000",
                    address: "Head Office, Dhaka, Bangladesh",
                    bio: "System-level administrator with full platform control.",
                },
            });

            return { user, admin };
        });
        console.log("Super admin created: ", result.user)
    } catch (error) {
        console.log(error);
    }

}

export default seedSuperAdmin
