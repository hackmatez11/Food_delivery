import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: { type: Array, required: true },
  amount: { type: Number, required: true },
  address: { type: Object, required: true },
  status: { type: String, default: "Food Processing" },
  date: { type: Date, default: Date.now },
  payment: { type: Boolean, default: false },

  // ⚙️ Scheduling fields
  totalPrepTime: { type: Number, default: 0 }, // sum of prepTime from all items
  assignedChef: { type: Number, default: null },
  startTime: { type: Date },
  finishTime: { type: Date },
  etaMinutes: { type: Number }, // Estimated ready time in minutes
  priorityScore: { type: Number, default: 0 },
});

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;
