/**
 * Dodo Payments Gateway Integration
 *
 * This module provides integration with Dodo Payments for secure payment processing.
 * Uses checkout sessions to redirect users to a hosted checkout page.
 *
 * Environment Variables:
 *   DODO_PAYMENTS_API_KEY       - Your Dodo Payments API key
 *   DODO_PAYMENTS_WEBHOOK_KEY   - Webhook secret for verifying signatures
 *   DODO_PAYMENTS_ENVIRONMENT   - 'test_mode' or 'live_mode' (default: test_mode)
 *   DODO_PAYMENTS_PRODUCT_ID    - Default product ID for bill payments (from Dodo dashboard)
 */

import DodoPayments from "dodopayments";
import { Webhook } from "standardwebhooks";

// ============================================
// Configuration
// ============================================

const DODO_API_KEY = process.env.DODO_PAYMENTS_API_KEY || "";
const DODO_WEBHOOK_KEY = process.env.DODO_PAYMENTS_WEBHOOK_KEY || "";
const DODO_ENVIRONMENT =
  (process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode") ||
  "test_mode";
const DODO_PRODUCT_ID = process.env.DODO_PAYMENTS_PRODUCT_ID || "";

if (!DODO_API_KEY) {
  console.warn(
    "[Dodo Payments] DODO_PAYMENTS_API_KEY is not set — running in mock/demo mode",
  );
}

// Initialize the Dodo Payments client
export const dodoClient = new DodoPayments({
  bearerToken: DODO_API_KEY,
  environment: DODO_ENVIRONMENT,
});

// Initialize webhook verifier (using standardwebhooks)
const webhookVerifier = DODO_WEBHOOK_KEY ? new Webhook(DODO_WEBHOOK_KEY) : null;

// ============================================
// Types
// ============================================

export interface CreateCheckoutRequest {
  billId: string;
  billNo: string;
  amount: number; // Amount in INR (rupees)
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone: string;
  serviceType: string;
  connectionNo: string;
  returnUrl: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  checkoutUrl: string;
  paymentId?: string;
}

export interface DodoWebhookPayload {
  business_id: string;
  type: string; // e.g. 'payment.succeeded', 'payment.failed'
  timestamp: string;
  data: {
    payload_type: string;
    payment_id?: string;
    status?: string;
    amount?: number;
    currency?: string;
    customer?: {
      customer_id?: string;
      email?: string;
      name?: string;
    };
    metadata?: Record<string, string>;
    [key: string]: any;
  };
}

// ============================================
// Core Functions
// ============================================

/**
 * Create a Dodo Payments checkout session for a bill payment.
 * Returns a checkout URL that the frontend should redirect the user to.
 */
export async function createCheckoutSession(
  request: CreateCheckoutRequest,
): Promise<CheckoutSessionResponse> {
  // In demo/test mode without a valid API key, return a mock session
  if (!DODO_API_KEY) {
    return createMockCheckoutSession(request);
  }

  try {
    const session = await dodoClient.checkoutSessions.create({
      product_cart: [
        {
          product_id: DODO_PRODUCT_ID,
          quantity: 1,
        },
      ],
      customer: {
        email: request.userEmail || `${request.userPhone}@suvidha.gov.in`,
        name: request.userName,
      },
      metadata: {
        billId: request.billId,
        billNo: request.billNo,
        userId: request.userId,
        serviceType: request.serviceType,
        connectionNo: request.connectionNo,
        amount: String(request.amount),
      },
      return_url: request.returnUrl,
    });

    return {
      sessionId: (session as any).session_id || `session_${Date.now()}`,
      checkoutUrl: (session as any).checkout_url || (session as any).url || "",
      paymentId: (session as any).payment_id,
    };
  } catch (error: any) {
    console.error("Dodo Payments Checkout Error:", error);
    throw new Error(
      "Payment gateway error: " +
        (error.message || "Failed to create checkout session"),
    );
  }
}

/**
 * Create a one-time payment link via the Dodo Payments API.
 * Alternative to checkout sessions — creates a direct payment link.
 */
export async function createPaymentLink(
  request: CreateCheckoutRequest,
): Promise<{ paymentId: string; paymentLink: string }> {
  if (!DODO_API_KEY) {
    return createMockPaymentLink(request);
  }

  try {
    const payment = await dodoClient.payments.create({
      payment_link: true,
      billing: {
        city: "Guwahati",
        country: "IN",
        state: "Assam",
        street: "Suvidha Kiosk",
        zipcode: "781001",
      },
      customer: {
        email: request.userEmail || `${request.userPhone}@suvidha.gov.in`,
        name: request.userName,
      },
      product_cart: [
        {
          product_id: DODO_PRODUCT_ID,
          quantity: 1,
        },
      ],
      metadata: {
        billId: request.billId,
        billNo: request.billNo,
        userId: request.userId,
        serviceType: request.serviceType,
        connectionNo: request.connectionNo,
        amount: String(request.amount),
      },
    });

    return {
      paymentId: payment.payment_id,
      paymentLink: (payment as any).payment_link || "",
    };
  } catch (error: any) {
    console.error("Dodo Payments Link Error:", error);
    throw new Error(
      "Payment gateway error: " +
        (error.message || "Failed to create payment link"),
    );
  }
}

/**
 * Verify a Dodo Payments webhook signature using standardwebhooks.
 * Returns the parsed payload if valid, throws if invalid.
 */
export function verifyWebhookSignature(
  rawBody: string,
  headers: {
    "webhook-id": string;
    "webhook-signature": string;
    "webhook-timestamp": string;
  },
): DodoWebhookPayload {
  // In demo/test mode without a webhook key, parse without verification
  if (!webhookVerifier) {
    console.warn(
      "[Dodo Payments] Webhook verification skipped (no webhook key configured)",
    );
    return JSON.parse(rawBody) as DodoWebhookPayload;
  }

  try {
    webhookVerifier.verify(rawBody, headers);
    return JSON.parse(rawBody) as DodoWebhookPayload;
  } catch (error: any) {
    console.error("Webhook verification failed:", error);
    throw new Error("Invalid webhook signature");
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if running in test mode
 */
export function isTestMode(): boolean {
  return DODO_ENVIRONMENT === "test_mode" || !DODO_API_KEY;
}

/**
 * Get the Dodo Payments environment info for the frontend
 */
export function getDodoConfig() {
  return {
    environment: DODO_ENVIRONMENT,
    isTestMode: isTestMode(),
    currency: "INR",
    baseUrl:
      DODO_ENVIRONMENT === "test_mode"
        ? "https://test.dodopayments.com"
        : "https://live.dodopayments.com",
  };
}

// ============================================
// Mock Functions for Test/Demo Mode
// ============================================

function createMockCheckoutSession(
  request: CreateCheckoutRequest,
): CheckoutSessionResponse {
  const sessionId = `sess_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const paymentId = `pay_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // In test mode, redirect to the return URL with mock success params
  const returnUrl = new URL(request.returnUrl);
  returnUrl.searchParams.set("payment_id", paymentId);
  returnUrl.searchParams.set("status", "succeeded");
  returnUrl.searchParams.set("session_id", sessionId);

  console.log(
    `[Dodo Mock] Created checkout session: ${sessionId} for bill ${request.billNo}, amount ₹${request.amount}`,
  );

  return {
    sessionId,
    checkoutUrl: returnUrl.toString(),
    paymentId,
  };
}

function createMockPaymentLink(request: CreateCheckoutRequest): {
  paymentId: string;
  paymentLink: string;
} {
  const paymentId = `pay_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log(
    `[Dodo Mock] Created payment link: ${paymentId} for bill ${request.billNo}, amount ₹${request.amount}`,
  );

  return {
    paymentId,
    paymentLink: `https://checkout.dodopayments.com/mock/${paymentId}`,
  };
}
