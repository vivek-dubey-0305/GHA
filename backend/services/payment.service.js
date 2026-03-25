// services/payment.service.js
import crypto from "crypto";
import Razorpay from "razorpay";
import { Wallet } from "../models/wallet.model.js";
import logger from "../configs/logger.config.js";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || RAZORPAY_KEY_SECRET;

let razorpayInstance = null;

function getRazorpayClient() {
	if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
		throw new Error("Razorpay credentials are not configured");
	}

	if (!razorpayInstance) {
		razorpayInstance = new Razorpay({
			key_id: RAZORPAY_KEY_ID,
			key_secret: RAZORPAY_KEY_SECRET
		});
	}

	return razorpayInstance;
}

export async function createRazorpayOrder({ amount, currency = "INR", receipt, notes = {} }) {
	try {
		const client = getRazorpayClient();

		const order = await client.orders.create({
			amount: Math.round(Number(amount) * 100),
			currency,
			receipt,
			notes
		});

		logger.info(`Razorpay order created | orderId=${order.id} | amountPaise=${order.amount}`);

		return order;
	} catch (error) {
		const normalizedMessage =
			error?.error?.description ||
			error?.error?.reason ||
			error?.message ||
			"Failed to create Razorpay order";

		logger.error(`Razorpay order creation failed: ${normalizedMessage}`);
		throw new Error(normalizedMessage);
	}
}

export function verifyRazorpayPaymentSignature({ orderId, paymentId, signature }) {
	if (!orderId || !paymentId || !signature) {
		return false;
	}

	const payload = `${orderId}|${paymentId}`;
	const expected = crypto
		.createHmac("sha256", RAZORPAY_KEY_SECRET)
		.update(payload)
		.digest("hex");

	return expected === signature;
}

export function verifyRazorpayWebhookSignature({ rawBody, signature }) {
	if (!signature || !RAZORPAY_WEBHOOK_SECRET) return false;

	const payload = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : String(rawBody || "");
	const expected = crypto
		.createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
		.update(payload)
		.digest("hex");

	return expected === signature;
}

export function getPublicRazorpayConfig() {
	if (!RAZORPAY_KEY_ID) {
		throw new Error("Razorpay public key is not configured");
	}

	return {
		keyId: RAZORPAY_KEY_ID
	};
}

export async function creditWalletForCourseSale({
	instructorId,
	amount,
	paymentId,
	courseId,
	metadata = {}
}) {
	if (!instructorId || !amount) {
		throw new Error("Instructor and amount are required for wallet credit");
	}

	const wallet = await Wallet.getOrCreateWallet(instructorId, "Instructor", "INR");

	const transaction = await wallet.credit(
		amount,
		"course_earning",
		`Course sale credit for payment ${paymentId}`,
		{
			referenceId: paymentId,
			referenceModel: "Payment",
			metadata: {
				courseId,
				...metadata
			}
		}
	);

	logger.info(`Instructor wallet credited | instructor=${instructorId} | amount=${amount} | payment=${paymentId}`);

	return transaction;
}

