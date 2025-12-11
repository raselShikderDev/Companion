import { MatchStatus } from "@prisma/client";
import { prisma } from "../../configs/db.config";

const getExplorerAnalysis = async (userId: string) => {
  const explorer = await prisma.explorer.findFirst({
    where: { userId },
  });

  if (!explorer) throw new Error("Explorer not found");

  const matchSuccessRate = await prisma.match.aggregate({
    where: {
      OR: [
        { requesterId: explorer.id },
        { recipientId: explorer.id },
      ],
      status: MatchStatus.ACCEPTED,
    },
    _count: true,
  });

  const completedTrips = await prisma.trip.count({
    where: {
      creatorId: explorer.id,
      matchCompleted: true,
    },
  });

  const avgRating = await prisma.review.aggregate({
    where: { reviewerId: explorer.id },
    _avg: { rating: true },
  });

  return {
    matchSuccessRate: matchSuccessRate._count,
    completedTrips,
    averageRating: avgRating._avg.rating || 0,
  };
};

const getAdminAnalysis = async () => {
  const tripCompletionRate = await prisma.trip.aggregate({
    _count: true,
    where: { matchCompleted: true },
  });

  const userGrowth = await prisma.user.count();

  const reviewDistribution = await prisma.review.groupBy({
    by: ["rating"],
    _count: true,
  });

  return {
    tripCompletionRate: tripCompletionRate._count,
    userGrowth,
    reviewDistribution,
  };
};

export const AnalysisService = {
  getExplorerAnalysis,
  getAdminAnalysis,
};
