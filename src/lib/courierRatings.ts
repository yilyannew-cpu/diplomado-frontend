import { courierReviewsMock } from "@/mocks/courierReviewsMock";

export interface CourierRatingSummary {
  averageRating: number;
  reviewCount: number;
}

const EMPTY_RATING: CourierRatingSummary = { averageRating: 0, reviewCount: 0 };

export function getCourierRating(courierId: string): CourierRatingSummary {
  const reviews = courierReviewsMock.filter((review) => review.courierId === courierId);
  if (reviews.length === 0) return EMPTY_RATING;

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    averageRating: Math.round((total / reviews.length) * 10) / 10,
    reviewCount: reviews.length,
  };
}

export function getCourierReviews(courierId: string) {
  return courierReviewsMock.filter((review) => review.courierId === courierId);
}
