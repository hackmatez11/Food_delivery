import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import foodModel from "../models/foodModel.js";
import Stripe from "stripe";
import Scheduler from "../scheduler/scheduler.js";

const scheduler = new Scheduler(2); // Two chefs in kitchen


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


const getETAs = async (req, res) => {
  try {
    const etas = scheduler.getETAs();
    res.status(200).json({ success: true, etas });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching ETAs" });
  }
};

// placing user order for frontend
const placeOrder = async (req, res) => {
  const frontend_url = "http://localhost:5173";

  try {
    const { userId, items, amount, address } = req.body;

    // 1️⃣ Fetch food prep times from DB
    const foodNames = items.map((i) => i.name);
    const foodItems = await foodModel.find({ name: { $in: foodNames } });

    if (!foodItems.length) {
      return res.json({ success: false, message: "Invalid food items" });
    }

    // 2️⃣ Compute total preparation time
    const totalPrepTime = foodItems.reduce((sum, f) => sum + f.prepTime, 0);

    // 3️⃣ Create order in DB (same as before)
    const newOrder = new orderModel({
      userId,
      items,
      amount,
      address,
      startTime: new Date(),
      totalPrepTime,
      etaMinutes: totalPrepTime,  // 🔹 total prep time for order

    });
    await newOrder.save();

    // Clear user cart
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    // 4️⃣ Scheduling: Add this order to the scheduler queue
    scheduler.addOrder({
      id: newOrder._id.toString(),
      customer: userId,
      items: foodItems.map((f) => ({ name: f.name, prep_time: f.prepTime })),
    });

    // 5️⃣ Get ETA & Chef assignment from scheduler
    const etaInfo = scheduler.getETAs().find((o) => o.id === newOrder._id.toString());
    if (etaInfo) {
      newOrder.assignedChef = etaInfo.assignedChef;
      newOrder.etaMinutes = etaInfo.etaMinutes;
      await newOrder.save();
    }

    // 6️⃣ Prepare Stripe line items
    const line_items = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.name },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    }));

    // Add delivery charge
    line_items.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Delivery Charges" },
        unit_amount: 2 * 100,
      },
      quantity: 1,
    });

    // 7️⃣ Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: line_items,
      mode: "payment",
      success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
    });

    // 8️⃣ Respond to frontend with session URL + ETA details
    res.json({
      success: true,
      session_url: session.url,
      orderId: newOrder._id,
      etaMinutes: newOrder.etaMinutes,
      assignedChef: newOrder.assignedChef,
    });
  } catch (error) {
    console.error("❌ Error placing order:", error);
    res.json({ success: false, message: "Error placing order" });
  }
};



const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    if (success == "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      res.json({ success: true, message: "Paid" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Not Paid" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// user orders for frontend
const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.body.userId });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Listing orders for admin pannel
const listOrders = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId);
    if (userData && userData.role === "admin") {
      const orders = await orderModel.find({});
      res.json({ success: true, data: orders });
    } else {
      res.json({ success: false, message: "You are not admin" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// api for updating status
const updateStatus = async (req, res) => {
  try {
    let userData = await userModel.findById(req.body.userId);
    if (userData && userData.role === "admin") {
      await orderModel.findByIdAndUpdate(req.body.orderId, {
        status: req.body.status,
      });
      res.json({ success: true, message: "Status Updated Successfully" });
    }else{
      res.json({ success: false, message: "You are not an admin" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus , getETAs };
