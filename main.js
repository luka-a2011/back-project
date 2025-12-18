require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const connecttodb = require("./db/connecttodb");
const swagger = require("./swagger");

const authRouter = require("./auth/auth.route");
const postRouter = require("./posts/post.route");
const userRouter = require("./users/user.route");
const dashboardRouter = require("./routes/dashboard");
const adminRouter = require("./routes/admin.route");
const stripeRouter = require("./stripe/stripe.route");

const isAuth = require("./middlewares/isauth.middleware");
const { upload } = require("./config/clodinary.config");

const stripe = require("./config/stripe.config");
const orderModel = require("./models/order.model");

const app = express();

/* ================= STRIPE WEBHOOK (MUST BE FIRST) ================= */
app.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_KEY
      );
    } catch (err) {
      console.error("Webhook signature failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // ✅ Payment successful
    if (event.type === "checkout.session.completed") {
      await orderModel.findOneAndUpdate(
        { sessionId: event.data.object.id },
        { status: "PAID" }
      );
    }

    // ❌ Payment failed
    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;

      const session = await stripe.checkout.sessions.list({
        payment_intent: paymentIntent.id,
      });

      if (session.data.length) {
        await orderModel.findOneAndUpdate(
          { sessionId: session.data[0].id },
          { status: "FAILED" }
        );
      }
    }

    // ⏰ Session expired
    if (event.type === "checkout.session.expired") {
      await orderModel.findOneAndUpdate(
        { sessionId: event.data.object.id },
        { status: "FAILED" }
      );
    }

    res.json({ received: true });
  }
);

/* ================= NORMAL MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static("uploads"));

/* ================= SWAGGER ================= */
const specs = swaggerJsdoc(swagger);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));

/* ================= ROUTES ================= */
app.use("/auth", authRouter);
app.use("/posts", postRouter);
app.use("/api/users", isAuth, userRouter);
app.use("/admin", adminRouter);
app.use("/stripe", stripeRouter);
app.use("/dashboard", dashboardRouter);

/* ================= UPLOAD ================= */
app.post("/uploads", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  res.status(201).json({ file: req.file });
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 3000;

connecttodb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
