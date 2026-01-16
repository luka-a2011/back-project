const { Router } = require("express");
const stripe = require("../config/stripe.config");
const isAuth = require("../middlewares/isauth.middleware");
const orderModel = require("../models/order.model");

const stripeRouter = Router();

stripeRouter.post("/checkout", isAuth, async (req, res) => {
  const { productName, amount, description, reportId, type } = req.body;
  const typeNormalized = (type || "donation").toLowerCase().trim();

  if (!productName || !amount) {
    return res.status(400).json({ message: "Missing productName or amount" });
  }

  if (typeNormalized !== "competition" && !reportId) {
    return res.status(400).json({
      message: "reportId is required for donations",
    });
  }

  const amountInt = parseInt(amount);
  if (isNaN(amountInt) || amountInt <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  try {
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
        metadata: {
          userId: req.userId,
          type: typeNormalized,
          ...(typeNormalized !== "competition" && { reportId }),
        },
      },
      success_url: `${process.env.FRONT_END_URL}/?success=true`,
      cancel_url: `${process.env.FRONT_END_URL}/?canceled=true`,
    });

    const orderData = {
      user: req.userId,
      amount: amountInt,
      sessionId: session.id,
      status: "PENDING",
      type: typeNormalized,
    };

    if (typeNormalized !== "competition") {
      orderData.report = reportId;
    }

    if (typeNormalized === "competition") {
      orderData.competitionEntry = true;
    }

    await orderModel.create(orderData);

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ message: "Stripe error", error: err.message });
  }
});

module.exports = stripeRouter;
