import { prisma } from "../../configs/db.config";
import customError from "../../shared/customError";
import { StatusCodes } from "http-status-codes";
import { prismaQueryBuilder } from "../../shared/queryBuilder";

const getAllPayment = async (query: Record<string, string>) => {
  // return prisma.payment.findMany({
  //   include: { explorer: true },
  //   orderBy: { createdAt: "desc" },
  // });
  const { where, take, skip, orderBy } = prismaQueryBuilder(query, ["transactionId"]);

  const payments = await prisma.payment.findMany({
    where,
    skip,
    take,
    orderBy,
    include: {
      subscription: true,
    }
  });
  const total = await prisma.payment.count({ where });

  return {
    data: payments,
    meta: {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
      total
    }
  };

};

const getSinglePayment = async (id: string) => {
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
  getAllPayment,
  getSinglePayment,
  getMyPayments,
};
