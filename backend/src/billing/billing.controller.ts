import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  Headers,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * Endpoint to create a Razorpay payment order for a pricing tier
   */
  @UseGuards(JwtAuthGuard)
  @Post('order')
  async createPaymentOrder(
    @Body('tierId') tierId: string,
    @Req() req: any,
  ) {
    if (!tierId) {
      throw new BadRequestException('Missing required parameter: tierId');
    }
    const userId = req.user.id;
    return this.billingService.createOrder(userId, tierId);
  }

  /**
   * Unprotected webhook receiver endpoint for Razorpay payment signals
   */
  @Post('webhook')
  async handleRazorpayWebhook(
    @Req() req: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing signature header: x-razorpay-signature');
    }

    const rawBodyBuffer = req.rawBody;
    if (!rawBodyBuffer) {
      throw new BadRequestException('Raw request body buffer is missing. Ensure rawBody: true is set in NestFactory.');
    }

    const rawBody = rawBodyBuffer.toString('utf8');
    return this.billingService.handleWebhook(rawBody, signature);
  }

  /**
   * Endpoint to verify standard checkout signature and credit accounts
   */
  @UseGuards(JwtAuthGuard)
  @Post('verify-payment')
  async verifyPayment(
    @Body('razorpay_order_id') razorpayOrderId: string,
    @Body('razorpay_payment_id') razorpayPaymentId: string,
    @Body('razorpay_signature') razorpaySignature: string,
    @Body('tierId') tierId: string,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.billingService.verifyPaymentSignature(
      userId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      tierId,
    );
  }
}
