/**
 * Payment Routes with Dodo Payments Integration
 *
 * Provides secure payment processing with:
 * - Checkout session creation (redirects to Dodo hosted checkout)
 * - Payment link generation
 * - Webhook handling for payment status updates
 * - Payment confirmation and record keeping
 * - Receipt generation
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "@suvidha/database";
import { authenticate, AuthRequest as AuthReq } from "../../middleware/auth";
import { ApiError } from "../../middleware/errorHandler";
import {
  createCheckoutSession,
  createPaymentLink,
  verifyWebhookSignature,
  getDodoConfig,
  isTestMode,
  type DodoWebhookPayload,
} from "./dodo";

const router = Router();

// ============================================
// Get Dodo Payments configuration for frontend
// ============================================
router.get("/config", (req, res) => {
  res.json({
    success: true,
    data: getDodoConfig(),
  });
});

// ============================================
// Create checkout session (redirects user to Dodo hosted checkout)
// ============================================
const createOrderSchema = z.object({
  billId: z.string(),
  amount: z.number().positive(),
  returnUrl: z.string().url().optional(),
});

router.post("/create-order", authenticate, async (req: AuthReq, res, next) => {
  try {
    const { billId, amount, returnUrl } = createOrderSchema.parse(req.body);

    // Verify bill exists and belongs to user
    const bill = await prisma.bill.findFirst({
      where: {
        id: billId,
        userId: req.user!.id,
      },
      include: {
        connection: true,
      },
    });

    if (!bill) {
      throw new ApiError("Bill not found", 404);
    }

    if (bill.status === "PAID") {
      throw new ApiError("Bill already paid", 400);
    }

    // Verify amount
    const remainingAmount = bill.totalAmount - bill.amountPaid;
    if (amount > remainingAmount + 0.01) {
      throw new ApiError(
        `Amount exceeds remaining balance of ₹${remainingAmount}`,
        400,
      );
    }

    // Default return URL — the frontend payment confirmation page
    const defaultReturnUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/bills/${billId}/pay/confirm`;

    // Create Dodo Payments checkout session
    const session = await createCheckoutSession({
      billId: bill.id,
      billNo: bill.billNo,
      amount,
      userId: req.user!.id,
      userName: req.user!.name,
      userEmail: req.user!.email || undefined,
      userPhone: req.user!.phone,
      serviceType: bill.connection.serviceType,
      connectionNo: bill.connection.connectionNo,
      returnUrl: returnUrl || defaultReturnUrl,
    });

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        checkoutUrl: session.checkoutUrl,
        paymentId: session.paymentId,
        amount,
        currency: "INR",
        bill: {
          id: bill.id,
          billNo: bill.billNo,
          serviceType: bill.connection.serviceType,
          connectionNo: bill.connection.connectionNo,
        },
        isTestMode: isTestMode(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// Confirm payment after redirect from Dodo checkout
// (Called by the frontend after user returns from Dodo checkout)
// ============================================
const confirmPaymentSchema = z.object({
  billId: z.string(),
  paymentId: z.string(), // Dodo payment_id from redirect URL params
  sessionId: z.string().optional(),
  amount: z.number().positive(),
  method: z.enum(["UPI", "CARD", "NET_BANKING", "WALLET"]).default("UPI"),
});

router.post("/confirm", authenticate, async (req: AuthReq, res, next) => {
  try {
    const data = confirmPaymentSchema.parse(req.body);

    // Verify bill
    const bill = await prisma.bill.findFirst({
      where: {
        id: data.billId,
        userId: req.user!.id,
      },
      include: {
        connection: true,
      },
    });

    if (!bill) {
      throw new ApiError("Bill not found", 404);
    }

    if (bill.status === "PAID") {
      throw new ApiError("Bill already paid", 400);
    }

    // Check if we already recorded this payment (idempotency)
    const existingPayment = await prisma.payment.findFirst({
      where: {
        transactionId: data.paymentId,
      },
    });

    if (existingPayment) {
      res.json({
        success: true,
        data: {
          paymentId: existingPayment.id,
          transactionId: existingPayment.transactionId,
          receiptNo: existingPayment.receiptNo,
          amount: existingPayment.amount,
          status: existingPayment.status,
          message: "Payment already recorded",
        },
      });
      return;
    }

    // Generate receipt number
    const receiptNo = `RCP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: req.user!.id,
        billId: data.billId,
        amount: data.amount,
        method: data.method,
        status: "SUCCESS",
        transactionId: data.paymentId,
        receiptNo,
        paidAt: new Date(),
        kioskId: req.headers["x-kiosk-id"] as string,
        gatewayResponse: {
          gateway: "dodo_payments",
          paymentId: data.paymentId,
          sessionId: data.sessionId || null,
          confirmedAt: new Date().toISOString(),
        },
      },
    });

    // Update bill
    const newAmountPaid = bill.amountPaid + data.amount;
    const newStatus = newAmountPaid >= bill.totalAmount ? "PAID" : "PARTIAL";

    await prisma.bill.update({
      where: { id: data.billId },
      data: {
        amountPaid: newAmountPaid,
        status: newStatus,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        type: "PAYMENT_SUCCESS",
        title: "Payment Successful",
        titleHi: "भुगतान सफल",
        message: `Your payment of ₹${data.amount} for ${bill.connection.serviceType} bill ${bill.billNo} was successful. Receipt: ${receiptNo}`,
        messageHi: `₹${data.amount} का भुगतान ${bill.connection.serviceType} बिल ${bill.billNo} के लिए सफल रहा। रसीद: ${receiptNo}`,
        data: {
          paymentId: payment.id,
          receiptNo,
          transactionId: data.paymentId,
        },
      },
    });

    res.json({
      success: true,
      data: {
        paymentId: payment.id,
        transactionId: data.paymentId,
        receiptNo,
        amount: data.amount,
        status: "SUCCESS",
        message: "Payment confirmed and recorded successfully",
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// Legacy /verify endpoint — maps to /confirm for backward compatibility
// ============================================
router.post("/verify", authenticate, async (req: AuthReq, res, next) => {
  try {
    // Map old Razorpay-style fields to new Dodo format
    const body = req.body;
    const mappedBody = {
      billId: body.billId,
      paymentId:
        body.razorpay_payment_id || body.paymentId || body.dodo_payment_id,
      sessionId:
        body.razorpay_order_id || body.sessionId || body.dodo_session_id,
      amount: body.amount,
      method: body.method || "UPI",
    };

    // Forward to the confirm handler
    req.body = mappedBody;
    const confirmHandler = router.stack.find(
      (layer: any) =>
        layer.route?.path === "/confirm" && layer.route?.methods?.post,
    );

    // Just call the confirm logic directly
    const data = confirmPaymentSchema.parse(mappedBody);

    const bill = await prisma.bill.findFirst({
      where: { id: data.billId, userId: req.user!.id },
      include: { connection: true },
    });

    if (!bill) throw new ApiError("Bill not found", 404);
    if (bill.status === "PAID") throw new ApiError("Bill already paid", 400);

    const existingPayment = await prisma.payment.findFirst({
      where: { transactionId: data.paymentId },
    });

    if (existingPayment) {
      res.json({
        success: true,
        data: {
          paymentId: existingPayment.id,
          transactionId: existingPayment.transactionId,
          receiptNo: existingPayment.receiptNo,
          amount: existingPayment.amount,
          status: existingPayment.status,
          message: "Payment already recorded",
        },
      });
      return;
    }

    const receiptNo = `RCP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const payment = await prisma.payment.create({
      data: {
        userId: req.user!.id,
        billId: data.billId,
        amount: data.amount,
        method: data.method,
        status: "SUCCESS",
        transactionId: data.paymentId,
        receiptNo,
        paidAt: new Date(),
        kioskId: req.headers["x-kiosk-id"] as string,
        gatewayResponse: {
          gateway: "dodo_payments",
          paymentId: data.paymentId,
          sessionId: data.sessionId || null,
          verifiedAt: new Date().toISOString(),
        },
      },
    });

    const newAmountPaid = bill.amountPaid + data.amount;
    const newStatus = newAmountPaid >= bill.totalAmount ? "PAID" : "PARTIAL";

    await prisma.bill.update({
      where: { id: data.billId },
      data: { amountPaid: newAmountPaid, status: newStatus },
    });

    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        type: "PAYMENT_SUCCESS",
        title: "Payment Successful",
        titleHi: "भुगतान सफल",
        message: `Your payment of ₹${data.amount} for ${bill.connection.serviceType} bill ${bill.billNo} was successful. Receipt: ${receiptNo}`,
        messageHi: `₹${data.amount} का भुगतान ${bill.connection.serviceType} बिल ${bill.billNo} के लिए सफल रहा। रसीद: ${receiptNo}`,
        data: {
          paymentId: payment.id,
          receiptNo,
          transactionId: data.paymentId,
        },
      },
    });

    res.json({
      success: true,
      data: {
        paymentId: payment.id,
        transactionId: data.paymentId,
        receiptNo,
        amount: data.amount,
        status: "SUCCESS",
        message: "Payment verified and recorded successfully",
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// Dodo Payments webhook handler
// Receives real-time notifications for payment events
// ============================================
router.post("/webhook", async (req, res) => {
  try {
    // Extract webhook headers
    const webhookHeaders = {
      "webhook-id": (req.headers["webhook-id"] as string) || "",
      "webhook-signature": (req.headers["webhook-signature"] as string) || "",
      "webhook-timestamp": (req.headers["webhook-timestamp"] as string) || "",
    };

    // Verify and parse the webhook payload
    const rawBody =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    let event: DodoWebhookPayload;

    try {
      event = verifyWebhookSignature(rawBody, webhookHeaders);
    } catch (verifyError) {
      console.error("Webhook signature verification failed:", verifyError);
      res.status(401).json({ error: "Invalid webhook signature" });
      return;
    }

    // Acknowledge receipt immediately (Dodo requires 2xx response)
    res.status(200).json({ received: true });

    // Process webhook asynchronously
    processWebhookEvent(event).catch((err) => {
      console.error("Error processing webhook event:", err);
    });
  } catch (error) {
    console.error("Webhook handler error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

/**
 * Process Dodo Payments webhook events asynchronously
 */
async function processWebhookEvent(event: DodoWebhookPayload) {
  console.log(`[Dodo Webhook] Received event: ${event.type}`);

  switch (event.type) {
    case "payment.succeeded": {
      const paymentData = event.data;
      const paymentId = paymentData.payment_id;
      const metadata = paymentData.metadata || {};

      console.log(`[Dodo Webhook] Payment succeeded: ${paymentId}`);

      // Check if this payment was already recorded via /confirm endpoint
      if (paymentId) {
        const existingPayment = await prisma.payment.findFirst({
          where: { transactionId: paymentId },
        });

        if (existingPayment) {
          // Already recorded — ensure status is SUCCESS
          if (existingPayment.status !== "SUCCESS") {
            await prisma.payment.update({
              where: { id: existingPayment.id },
              data: { status: "SUCCESS" },
            });
          }
          console.log(
            `[Dodo Webhook] Payment ${paymentId} already recorded, status confirmed.`,
          );
          return;
        }

        // Payment not yet recorded (user might not have returned to the app)
        // Record it using metadata
        if (metadata.billId && metadata.userId) {
          const bill = await prisma.bill.findFirst({
            where: { id: metadata.billId },
            include: { connection: true },
          });

          if (bill && bill.status !== "PAID") {
            const amount = parseFloat(metadata.amount || "0");
            const receiptNo = `RCP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

            await prisma.payment.create({
              data: {
                userId: metadata.userId,
                billId: metadata.billId,
                amount: amount,
                method: "UPI", // Default — Dodo handles the method
                status: "SUCCESS",
                transactionId: paymentId,
                receiptNo,
                paidAt: new Date(),
                gatewayResponse: {
                  gateway: "dodo_payments",
                  paymentId,
                  source: "webhook",
                  eventType: event.type,
                  receivedAt: new Date().toISOString(),
                },
              },
            });

            const newAmountPaid = bill.amountPaid + amount;
            const newStatus =
              newAmountPaid >= bill.totalAmount ? "PAID" : "PARTIAL";

            await prisma.bill.update({
              where: { id: metadata.billId },
              data: { amountPaid: newAmountPaid, status: newStatus },
            });

            await prisma.notification.create({
              data: {
                userId: metadata.userId,
                type: "PAYMENT_SUCCESS",
                title: "Payment Successful",
                titleHi: "भुगतान सफल",
                message: `Your payment of ₹${amount} for bill ${bill.billNo} was successful. Receipt: ${receiptNo}`,
                messageHi: `₹${amount} का भुगतान बिल ${bill.billNo} के लिए सफल रहा। रसीद: ${receiptNo}`,
                data: { paymentId, receiptNo, transactionId: paymentId },
              },
            });

            console.log(
              `[Dodo Webhook] Payment ${paymentId} recorded via webhook for bill ${bill.billNo}`,
            );
          }
        }
      }
      break;
    }

    case "payment.failed": {
      const paymentId = event.data.payment_id;
      const metadata = event.data.metadata || {};
      console.log(`[Dodo Webhook] Payment failed: ${paymentId}`);

      // Record failed payment for tracking
      if (metadata.billId && metadata.userId && paymentId) {
        await prisma.payment.create({
          data: {
            userId: metadata.userId,
            billId: metadata.billId,
            amount: parseFloat(metadata.amount || "0"),
            method: "UPI",
            status: "FAILED",
            transactionId: paymentId,
            receiptNo: `FAIL_${Date.now()}`,
            gatewayResponse: {
              gateway: "dodo_payments",
              paymentId,
              source: "webhook",
              eventType: event.type,
              receivedAt: new Date().toISOString(),
            },
          },
        });

        // Notify user
        await prisma.notification.create({
          data: {
            userId: metadata.userId,
            type: "PAYMENT_SUCCESS", // Using existing type
            title: "Payment Failed",
            titleHi: "भुगतान विफल",
            message: `Your payment of ₹${metadata.amount || 0} failed. Please try again.`,
            messageHi: `₹${metadata.amount || 0} का भुगतान विफल रहा। कृपया पुनः प्रयास करें।`,
            data: { paymentId, status: "FAILED" },
          },
        });
      }
      break;
    }

    case "refund.created":
    case "refund.succeeded": {
      console.log(`[Dodo Webhook] Refund event: ${event.type}`, event.data);
      // Handle refunds as needed
      break;
    }

    default:
      console.log(`[Dodo Webhook] Unhandled event type: ${event.type}`);
  }
}

// ============================================
// Get payment status by payment ID
// ============================================
router.get(
  "/status/:paymentId",
  authenticate,
  async (req: AuthReq, res, next) => {
    try {
      const { paymentId } = req.params;

      // Find payment by transaction ID (Dodo payment_id)
      const payment = await prisma.payment.findFirst({
        where: {
          userId: req.user!.id,
          OR: [
            { transactionId: paymentId },
            {
              gatewayResponse: {
                path: ["paymentId"],
                equals: paymentId,
              },
            },
            {
              gatewayResponse: {
                path: ["sessionId"],
                equals: paymentId,
              },
            },
          ],
        },
        include: {
          bill: {
            include: { connection: true },
          },
        },
      });

      if (!payment) {
        res.json({
          success: true,
          data: {
            status: "pending",
            message: "Payment not yet completed",
          },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          status: payment.status,
          paymentId: payment.id,
          transactionId: payment.transactionId,
          receiptNo: payment.receiptNo,
          amount: payment.amount,
          paidAt: payment.paidAt,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
