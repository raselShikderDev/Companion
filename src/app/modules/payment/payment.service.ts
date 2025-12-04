import { prisma } from "../../configs/db.config";
import customError from "../../shared/customError";
import { StatusCodes } from "http-status-codes";

const getAll = async () => {
  return prisma.payment.findMany({
    include: { explorer: true },
    orderBy: { createdAt: "desc" },
  });
};

const getSingle = async (id: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { explorer: true },
  });

  if (!payment)
    throw new customError(StatusCodes.NOT_FOUND, "Payment not found");

  return payment;
};

const getMyPayments = async (userId: string) => {
  const explorer = await prisma.explorer.findFirst({
    where: { userId },
  });

  if (!explorer)
    throw new customError(StatusCodes.NOT_FOUND, "Explorer not found");

  return prisma.payment.findMany({
    where: { explorerId: explorer.id },
    include: { explorer: true },
    orderBy: { createdAt: "desc" },
  });
};

export const PaymentService = {
  getAll,
  getSingle,
  getMyPayments,
};
