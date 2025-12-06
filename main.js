require('dotenv').config();
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
const isAuth = require("./middlewares/isauth.middleware");
const { upload } = require("./config/clodinary.config");
const app = express();

// ─────────────── Global Middleware ───────────────
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static("uploads"));

// ─────────────── Swagger Documentation ───────────────
const specs = swaggerJsdoc(swagger);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));

// ─────────────── Routes ───────────────
app.use("/auth", authRouter);
app.use("/posts", postRouter);
app.use("/api/users", isAuth, userRouter); // protected user routes
app.use("/dashboard", dashboardRouter);
app.use("/admin", adminRouter); // admin routes

// Simple root route
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Upload route (for testing standalone upload)
app.post("/uploads", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  res.status(201).json({ file: req.file });
});

// Start server after DB connection
const PORT = process.env.PORT || 3000;
connecttodb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
})
