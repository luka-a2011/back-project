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
stripeRouter.post("/checkout", isAuth, async (req, res) => {
  const { productName, amount, description } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Invalid donation amount" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productName,
              description,
            },
            unit_amount: amount, // in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        metadata: { userId: req.userId },
      },
      success_url: `${process.env.FRONT_END_URL}/?success=true`,
      cancel_url: `${process.env.FRONT_END_URL}/?canceled=true`,
    });

    // Save order in database
    await orderModel.create({
      user: req.userId,
      amount,
      sessionId: session.id,
      status: "PENDING",
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Stripe checkout creation failed", error: err.message });
  }
});

module.exports = stripeRouter;
