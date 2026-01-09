/** biome-ignore-all assist/source/organizeImports: > */
/** biome-ignore-all lint/suspicious/noExplicitAny: > */
import { prisma } from "../../configs/db.config";
import customError from "../../shared/customError";
import { StatusCodes } from "http-status-codes";
import { prismaQueryBuilder } from "../../shared/queryBuilder";
import { PaymentStatus } from "@prisma/client";
import { toJsonValue } from "../../helper/jasonValueConvertar";
import { universalQueryBuilder } from "../../shared/universalQueryBuilder";

const markPaymentFailed = async (tranId: string, payload?: any) => {
  const payment = await prisma.payment.findUnique({
    where: { transactionId: tranId },
  });

  if (!payment) {
    throw new customError(StatusCodes.NOT_FOUND, "Payment not found");
  }

  if (payment.status !== PaymentStatus.PENDING) {
    return payment; // idempotent
  }

  return prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.FAILED,
      rawResponse: toJsonValue(payload ?? { reason: "Payment failed" }),
    },
  });
};

const markPaymentCancelled = async (tranId: string, payload?: any) => {
  const payment = await prisma.payment.findUnique({
    where: { transactionId: tranId },
  });

  if (!payment) {
    throw new customError(StatusCodes.NOT_FOUND, "Payment not found");
  }

  if (payment.status !== PaymentStatus.PENDING) {
    return payment;
  }

  return prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: PaymentStatus.FAILED,
      rawResponse: toJsonValue(payload ?? { reason: "Payment cancelled" }),
    },
  });
};

const getAllPayment = async (query: Record<string, string>) => {
  const builtQuery = universalQueryBuilder("payment", query);


  const payments = await prisma.payment.findMany({
    where: builtQuery.where,
    include: {
      subscription: true,
      explorer: true,
    },
    orderBy: builtQuery.orderBy,
    skip: builtQuery.skip,
    take: builtQuery.take,
  });
  const total = await prisma.payment.count({ where: builtQuery.where });

  return {
    data: payments,
    meta: {
      ...builtQuery.meta,
      total,
    },
  };
// const data = await prisma.payment.findMany()
// console.log({data});
// return data

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
  markPaymentCancelled,
  markPaymentFailed,
};
