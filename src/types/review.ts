export interface OrderReviewSummary {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface SubmitReviewPayload {
  rating: number;
  comment?: string;
}
