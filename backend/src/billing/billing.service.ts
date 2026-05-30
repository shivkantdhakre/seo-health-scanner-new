import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

export const TIER_PLANS = {
  starter: {
    name: 'Starter Pack',
    amount: 200, // ₹200 INR
    credits: 5,  // 5 scans
    description: 'Perfect for single website owners',
  },
  pro: {
    name: 'Pro Pack',
    amount: 400, // ₹400 INR
    credits: 12, // 12 scans
    description: 'Ideal for freelancers & small businesses',
  },
  agency: {
    name: 'Agency Pack',
    amount: 1000, // ₹1000 INR
    credits: 35,  // 35 scans
    description: 'Designed for marketing & SEO agencies',
  },
};

@Injectable()
export class BillingService {
  private razorpay: Razorpay;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

    // Initialize Razorpay client. If keys are missing (fallback for tests), log warning.
    this.razorpay = new Razorpay({
      key_id: keyId || 'rzp_test_placeholder_key',
      key_secret: keySecret || 'placeholder_secret',
    });
  }

  /**
   * Generates a new Razorpay Order for a specific plan tier
   */
  async createOrder(userId: string, tierId: string) {
    const plan = TIER_PLANS[tierId as keyof typeof TIER_PLANS];
    if (!plan) {
      throw new BadRequestException(`Invalid plan tier: ${tierId}`);
    }

    try {
      const options = {
        amount: plan.amount * 100, // Amount in paise (₹1 = 100 paise)
        currency: 'INR',
        receipt: `receipt_user_${userId.slice(-6)}_${Date.now()}`,
        notes: {
          userId,
          tierId,
        },
      };

      const order = await this.razorpay.orders.create(options);
      return {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        tierId,
        tierName: plan.name,
      };
    } catch (error) {
      console.error('[BillingService] Razorpay order creation failed:', error);
      throw new BadRequestException('Failed to create payment order with billing provider.');
    }
  }

  /**
   * Securely processes Razorpay payment webhook
   */
  async handleWebhook(rawBody: string, signature: string) {
    const webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.warn('[BillingService] RAZORPAY_WEBHOOK_SECRET is not configured. Skipping validation.');
    } else {
      // Validate the HMAC signature using node crypto
      const shasum = crypto.createHmac('sha256', webhookSecret);
      shasum.update(rawBody);
      const digest = shasum.digest('hex');
      if (digest !== signature) {
        console.error('[BillingService] Webhook signature mismatch:', { received: signature, computed: digest });
        throw new UnauthorizedException('Invalid signature');
      }
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      throw new BadRequestException('Invalid JSON payload');
    }

    const event = payload.event;
    console.log(`[BillingService] Received Razorpay webhook event: ${event}`);

    // Listen for order payment completion
    if (event === 'order.paid' || event === 'payment.captured') {
      const paymentEntity = payload.payload?.payment?.entity || payload.payload?.order?.entity;
      const notes = paymentEntity?.notes;

      if (!notes?.userId || !notes?.tierId) {
        console.warn('[BillingService] Webhook metadata missing userId or tierId. Skipping.', notes);
        return { status: 'skipped', reason: 'Missing notes' };
      }

      const { userId, tierId } = notes;
      const plan = TIER_PLANS[tierId as keyof typeof TIER_PLANS];
      if (!plan) {
        console.error(`[BillingService] Invalid tierId: ${tierId} parsed in notes.`);
        return { status: 'error', reason: 'Invalid tier' };
      }

      const razorpayOrderId = payload.payload?.order?.entity?.id || payload.payload?.payment?.entity?.order_id;
      if (!razorpayOrderId) {
        console.warn('[BillingService] Webhook missing razorpayOrderId. Skipping.');
        return { status: 'skipped', reason: 'Missing razorpayOrderId' };
      }

      // Check if this order was already processed
      const existingTx = await this.prisma.transaction.findUnique({
        where: { razorpayOrderId }
      });

      if (existingTx) {
        console.log(`[BillingService] Webhook: Order ${razorpayOrderId} already processed. Skipping double provision.`);
        return { status: 'success', message: 'Already processed', userId };
      }

      // Provision credits and record transaction atomically
      const [updatedUser] = await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: { credits: { increment: plan.credits } },
        }),
        this.prisma.transaction.create({
          data: {
            razorpayOrderId,
            tierId,
            amount: plan.amount,
            userId,
          }
        })
      ]);

      console.log(
        `🚀 PROVISION SUCCESS: User ${updatedUser.email} has been credited with ${plan.credits} scans. New balance: ${updatedUser.credits}`,
      );

      return { status: 'success', userId, creditsAdded: plan.credits };
    }

    return { status: 'received', event };
  }

  /**
   * Verifies standard checkout signature and registers credit updates
   */
  async verifyPaymentSignature(
    userId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    tierId: string,
  ) {
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !tierId) {
      throw new BadRequestException('Missing required payment parameters.');
    }

    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    if (!keySecret) {
      throw new BadRequestException('Razorpay credentials secret key is not configured.');
    }

    // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const dataToSign = `${razorpayOrderId}|${razorpayPaymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(dataToSign)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      console.error('[BillingService] Payment signature mismatch:', {
        expected: generatedSignature,
        received: razorpaySignature,
      });
      throw new BadRequestException('Invalid signature verification failed.');
    }

    const plan = TIER_PLANS[tierId as keyof typeof TIER_PLANS];
    if (!plan) {
      throw new BadRequestException(`Invalid plan tier: ${tierId}`);
    }

    // Check if this order was already processed
    const existingTx = await this.prisma.transaction.findUnique({
      where: { razorpayOrderId }
    });

    if (existingTx) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      console.log(`[BillingService] verifyPaymentSignature: Order ${razorpayOrderId} already processed. Skipping double provision.`);
      return {
        success: true,
        message: 'Already processed',
        newBalance: user?.credits || 0,
      };
    }

    // Provision credits and record transaction atomically
    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: plan.credits } },
      }),
      this.prisma.transaction.create({
        data: {
          razorpayOrderId,
          tierId,
          amount: plan.amount,
          userId,
        }
      })
    ]);

    console.log(
      `🚀 SIGNATURE VERIFIED: User ${updatedUser.email} purchased ${plan.name} (+${plan.credits} credits). New balance: ${updatedUser.credits}`,
    );

    return {
      success: true,
      message: 'Payment verified successfully.',
      newBalance: updatedUser.credits,
    };
  }
}
