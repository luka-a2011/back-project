const { Router } = require("express");
const stripe = require("../config/stripe.config");
const isAuth = require("../middlewares/isauth.middleware");
const orderModel = require("../models/order.model");

const stripeRouter = Router();

// Example: Buy phone route (optional)
stripeRouter.post("/buy-phone", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: "price_1Rb4qwEWaHsE9wj75fpgOUsx",
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONT_END_URL}/?success=true`,
      cancel_url: `${process.env.FRONT_END_URL}/?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Stripe session creation failed", error: err.message });
  }
});

// Donation route
// stripe.route.js
stripeRouter.post("/checkout", isAuth, async (req, res) => {
  const { productName, amount, description } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productName,
              description,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: { userId: req.userId },
      },
      success_url: `${process.env.FRONT_END_URL}/?success=true`,
      cancel_url: `${process.env.FRONT_END_URL}/?canceled=true`,
    });

    await orderModel.create({
      user: req.userId,
      amount,
      sessionId: session.id,
      paymentIntentId: session.payment_intent,
      status: "PENDING",
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: "Stripe error" });
  }
});


module.exports = stripeRouter;
