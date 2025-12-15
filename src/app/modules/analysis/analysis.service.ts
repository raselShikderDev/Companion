import { MatchStatus, TripStatus } from "@prisma/client";
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

  const activeTrips = await prisma.trip.count({
    where: {
      creatorId: explorer.id,
      status: TripStatus.PLANNED,
    },
  });

  const avgRating = await prisma.review.aggregate({
    where: { reviewerId: explorer.id },
    _avg: { rating: true },
  });

  const [
    totalTrips,
    totalMatches,
    totalReviews,
    activeSubscription,
  ] = await Promise.all([
    prisma.trip.count({ where: { creatorId: explorer.id } }),
    prisma.match.count({
      where: {
        OR: [
          { requesterId: explorer.id },
          { recipientId: explorer.id },
        ],
      },
    }),
    prisma.review.count({
      where: { reviewerId: explorer.id },
    }),
    prisma.subscription.findUnique({
      where: { explorerId: explorer.id },
    }),
  ]);

  return {
    totalTrips,
    totalMatches,
    totalReviews,
    activeTrips,
    isPremium: explorer.isPremium,
    activeSubscription,
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

   const [
    totalUsers,
    totalExplorers,
    totalTrips,
    totalMatches,
    totalRevenue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.explorer.count(),
    prisma.trip.count(),
    prisma.match.count(),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "PAID" },
    }),
  ]);

  return {
    totalUsers,
    totalExplorers,
    totalTrips,
    totalMatches,
    totalRevenue: totalRevenue._sum.amount || 0,
    tripCompletionRate: tripCompletionRate._count,
    userGrowth,
    reviewDistribution,
  };
};

export const AnalysisService = {
  getExplorerAnalysis,
  getAdminAnalysis,
};
