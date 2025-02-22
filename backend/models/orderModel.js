import mongoose from "mongoose"

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  items: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "product", required: true },
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      size: { type: String, required: true },
    },
  ],
  address: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipcode: { type: String, required: true },
    phone: { type: String, required: true },
  },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  payment: { type: Boolean, required: true },
  status: {
    type: String,
    required: true,
    default: "Order Placed",
    enum: [
      "Order Placed",
      "Processing",
      "Packing",
      "Shipped",
      "Out for delivery",
      "Delivered",
      "Cancelled",
      "Cancellation Requested",
      "Return Requested",
      "Return Approved",
    ],
  },
  date: { type: Number, required: true },
})

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema)

export default orderModel

