const { Router } = require("express");
const stripe = require("../config/stripe.config");
const isAuth = require("../middlewares/isauth.middleware");
const orderModel = require("../models/order.model");

const stripeRouter = Router()


stripeRouter.post('/buy-phone', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: 'price_1Rb4qwEWaHsE9wj75fpgOUsx',
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.FRONT_END_URL}/?success=true`,
    cancel_url: `${process.env.FRONT_END_URL}/?canceled=true`,
  });

  res.json({ url: session.url })
})

stripeRouter.post('/checkout', isAuth, async (req, res) => {
  const { productName, amount, description } = req.body
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: productName, // dynamically passed from client
            images: ["https://example.com/hoodie.png"], // optional
            description,
          },
          unit_amount: amount, // amount in cents
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      metadata: {
        userId: req.userId
      }
    },
    mode: 'payment',
    success_url: `${process.env.FRONT_END_URL}/?success=true`,
    cancel_url: `${process.env.FRONT_END_URL}/?canceled=true`,
  });

  console.log(session, "sessions")
  await orderModel.create({amount, user: req.userId, sessionId: session.id})

  res.json({ url: session.url })
})


module.exports = stripeRouter