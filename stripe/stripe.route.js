const { Router } = require("express");
const stripe = require("../config/stripe.config");
const isAuth = require("../middlewares/isauth.middleware");
const orderModel = require("../models/order.model");

const stripeRouter = Router();

stripeRouter.post("/checkout", isAuth, async (req, res) => {
  const { productName, amount, description, reportId } = req.body;

  if (!productName || !amount || !reportId) {
    return res.status(400).json({
      message: "Missing productName, amount, or reportId",
    });
  }

  const amountInt = parseInt(amount);
  if (isNaN(amountInt) || amountInt <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  try {
    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productName,
              description: description || "",
            },
            unit_amount: amountInt,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: { userId: req.userId, reportId },
      },
      success_url: `${process.env.FRONT_END_URL}/?success=true`,
      cancel_url: `${process.env.FRONT_END_URL}/?canceled=true`,
    });

    // Save order to DB
    await orderModel.create({
      user: req.userId,
      report: reportId, // required now
      amount: amountInt,
      sessionId: session.id,
      paymentIntentId: session.payment_intent || undefined,
      status: "PENDING",
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return res.status(500).json({ message: "Stripe error", error: err.message });
  }
});

module.exports = stripeRouter;
