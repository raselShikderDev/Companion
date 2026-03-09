/** biome-ignore-all lint/style/useImportType: > */
import { Explorer, Review } from "@prisma/client";

export const calculateCompatibility = (
  user: Explorer,
  candidate: Explorer & { reviews: Review[] }
) => {
  let score = 0;

  // Interest overlap
  const interestOverlap =
    user.interests.filter((i) => candidate.interests.includes(i)).length || 0;

  const interestScore =
    user.interests.length > 0
      ? interestOverlap / user.interests.length
      : 0;

  score += interestScore * 40;

  // Travel style overlap
  const styleOverlap =
    user.travelStyleTags.filter((i) =>
      candidate.travelStyleTags.includes(i)
    ).length || 0;

  const styleScore =
    user.travelStyleTags.length > 0
      ? styleOverlap / user.travelStyleTags.length
      : 0;

  score += styleScore * 30;

  // Average rating
  const avgRating =
    candidate.reviews.length > 0
      ? candidate.reviews.reduce((a, b) => a + b.rating, 0) /
        candidate.reviews.length
      : 3;

  score += (avgRating / 5) * 30;

  return Number(score.toFixed(2));
};