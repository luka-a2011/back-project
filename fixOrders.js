require("dotenv").config();
const mongoose = require("mongoose");
const Order = require("./models/order.model"); // adjust path if needed

mongoose.connect(process.env.MONGO_URL, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(async () => {
  console.log("Connected to DB");

  const result = await Order.updateMany(
    { post: { $exists: true } },
    { $unset: { post: "" } }
  );

  console.log("Removed 'post' field from orders:", result.modifiedCount);
  process.exit(0);
})
.catch(err => {
  console.error("DB connection error:", err);
  process.exit(1);
});
