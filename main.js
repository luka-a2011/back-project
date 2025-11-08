const express = require("express");
const cors = require("cors");
const userRouter = require("./users/user.route");
const authRouter = require("./auth/auth.route");
const postRouter = require("./posts/post.route");
const isAuth = require("./middlewares/isauth.middleware");
const connecttodb = require("./db/connecttodb");
const swagger = require("./swagger");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const cookieParser = require("cookie-parser");
const dashboardRouter = require("./routes/dashboard");
const { upload } = require("./config/clodinary.config");

const app = express();

app.use(cors());

app.use(express.json());
app.use(cookieParser());




// Middlewares

app.use(express.json());
app.use(express.static("uploads"));

// Swagger setup
const specs = swaggerJsdoc(swagger);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use("/auth", authRouter);
app.use("/posts", isAuth, postRouter);
app.use("/users", isAuth, userRouter);

const dashboardRouter = require("./routes/dashboard.route");
app.use("/dashboard", dashboardRouter);

// Simple root route
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Image upload route
app.post("/uploads", upload.single("image"), (req, res) => {
  res.send(req.file);
});

// Start server after DB connection
const PORT = process.env.PORT || 3000;
connecttodb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
})
