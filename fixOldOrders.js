const mongoose = require("mongoose");
require("dotenv").config();
const orderModel = require("./models/order.model");
const reportModel = require("./models/report.model");

mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    console.log("Connected to DB");

    const orders = await orderModel.find({});

    for (const order of orders) {
      const reportExists = await reportModel.findById(order.report);
      if (!reportExists) {
        console.log(`Deleting order ${order._id} because report does not exist`);
        await order.deleteOne();
      }
    }

    console.log("Old invalid orders removed");
    mongoose.disconnect();
  })
  .catch(console.error);
