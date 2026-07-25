export type PaymentStatus = "pending" | "paid" | "failed" | "refund_pending" | "refunded";

export interface Payment {
  id: string;
  reportId: string;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId: string | null;
  amountMinor: number;
  currency: string;
  priceVersion: string;
  status: PaymentStatus;
  mode: "test" | "live";
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentInput {
  reportId: string;
  stripeCheckoutSessionId: string;
  amountMinor: number;
  currency: string;
  priceVersion: string;
  mode: "test" | "live";
}
