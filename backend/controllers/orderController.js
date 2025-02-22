import orderModel from "../models/orderModel.js"
import userModel from "../models/userModel.js"
import productModel from "../models/productModel.js"
import Stripe from "stripe"
import razorpay from "razorpay"
import mongoose from "mongoose"

// Global variables
const currency = "inr"
const deliveryCharge = 10

// Gateway initialize
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// New function to check stock availability
const checkStockAvailability = async (items) => {
  for (const item of items) {
    const product = await productModel.findById(item._id)
    if (!product || product.stock < item.quantity) {
      return false
    }
  }
  return true
}

// Placing orders using COD Method
const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body

    // Check stock availability
    const isStockAvailable = await checkStockAvailability(items)
    if (!isStockAvailable) {
      return res.json({ success: false, message: "Some items are out of stock" })
    }

    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: "COD",
      payment: false,
      date: Date.now(),
    }

    const newOrder = new orderModel(orderData)
    await newOrder.save()

    // Update stock
    for (const item of items) {
      await productModel.findByIdAndUpdate(item._id, { $inc: { stock: -item.quantity } })
    }

    await userModel.findByIdAndUpdate(userId, { cartData: {} })

    res.json({ success: true, message: "Order Placed" })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// Placing orders using Stripe Method
const placeOrderStripe = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body
    const { origin } = req.headers

    // Check stock availability
    const isStockAvailable = await checkStockAvailability(items)
    if (!isStockAvailable) {
      return res.json({ success: false, message: "Some items are out of stock" })
    }

    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: "Stripe",
      payment: false,
      date: Date.now(),
    }

    const newOrder = new orderModel(orderData)
    await newOrder.save()

    const line_items = items.map((item) => ({
      price_data: {
        currency: currency,
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    }))

    line_items.push({
      price_data: {
        currency: currency,
        product_data: {
          name: "Delivery Charges",
        },
        unit_amount: deliveryCharge * 100,
      },
      quantity: 1,
    })

    const session = await stripe.checkout.sessions.create({
      success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
      line_items,
      mode: "payment",
    })

    res.json({ success: true, session_url: session.url })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// Verify Stripe
const verifyStripe = async (req, res) => {
  const { orderId, success, userId } = req.body

  try {
    if (success === "true") {
      const order = await orderModel.findByIdAndUpdate(orderId, { payment: true })

      // Update stock
      for (const item of order.items) {
        await productModel.findByIdAndUpdate(item._id, { $inc: { stock: -item.quantity } })
      }

      await userModel.findByIdAndUpdate(userId, { cartData: {} })
      res.json({ success: true })
    } else {
      await orderModel.findByIdAndDelete(orderId)
      res.json({ success: false })
    }
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// Placing orders using Razorpay Method
const placeOrderRazorpay = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body

    // Check stock availability
    const isStockAvailable = await checkStockAvailability(items)
    if (!isStockAvailable) {
      return res.json({ success: false, message: "Some items are out of stock" })
    }

    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: "Razorpay",
      payment: false,
      date: Date.now(),
    }

    const newOrder = new orderModel(orderData)
    await newOrder.save()

    const options = {
      amount: amount * 100,
      currency: currency.toUpperCase(),
      receipt: newOrder._id.toString(),
    }

    await razorpayInstance.orders.create(options, (error, order) => {
      if (error) {
        console.log(error)
        return res.json({ success: false, message: error })
      }
      res.json({ success: true, order })
    })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

const verifyRazorpay = async (req, res) => {
  try {
    const { userId, razorpay_order_id } = req.body

    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)
    if (orderInfo.status === "paid") {
      const order = await orderModel.findByIdAndUpdate(orderInfo.receipt, { payment: true })

      // Update stock
      for (const item of order.items) {
        await productModel.findByIdAndUpdate(item._id, { $inc: { stock: -item.quantity } })
      }

      await userModel.findByIdAndUpdate(userId, { cartData: {} })
      res.json({ success: true, message: "Payment Successful" })
    } else {
      res.json({ success: false, message: "Payment Failed" })
    }
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// All Orders data for Admin Panel
const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({})
    res.json({ success: true, orders })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// User Order Data For Frontend
const userOrders = async (req, res) => {
  try {
    const { userId } = req.body
    const orders = await orderModel.find({ userId })
    res.json({ success: true, orders })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// Update order status from Admin Panel
const updateStatus = async (req, res) => {
  try {
    const { orderId, status, action } = req.body
    const order = await orderModel.findById(orderId)

    if (!order) {
      return res.json({ success: false, message: "Order not found" })
    }

    if (action === "approve_cancellation") {
      if (order.status !== "Cancellation Requested") {
        return res.json({ success: false, message: "Invalid action for current order status" })
      }
      order.status = "Cancelled"
      // Restore stock
      for (const item of order.items) {
        await productModel.findByIdAndUpdate(item._id, { $inc: { stock: item.quantity } })
      }
    } else if (action === "approve_return") {
      if (order.status !== "Return Requested") {
        return res.json({ success: false, message: "Invalid action for current order status" })
      }
      order.status = "Return Approved"
      // Restore stock
      for (const item of order.items) {
        await productModel.findByIdAndUpdate(item._id, { $inc: { stock: item.quantity } })
      }
    } else {
      order.status = status
    }

    await order.save()
    res.json({ success: true, message: "Status Updated" })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// Delete Order Handler
const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params

    // Validate orderId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      })
    }

    // Find and delete the order
    const deletedOrder = await orderModel.findByIdAndDelete(orderId)

    if (!deletedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    res.json({
      success: true,
      message: "Order deleted successfully",
    })
  } catch (error) {
    console.error("Delete order error:", error)
    res.json({
      success: false,
      message: error.message || "Error deleting order",
    })
  }
}

// New function to cancel order
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body
    const order = await orderModel.findById(orderId)

    if (!order) {
      return res.json({ success: false, message: "Order not found" })
    }

    if (order.status !== "Processing") {
      return res.json({ success: false, message: "Order cannot be cancelled at this stage" })
    }

    // Update order status
    order.status = "Cancellation Requested"
    await order.save()

    res.json({ success: true, message: "Cancellation request submitted successfully" })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// New function to return order
const returnOrder = async (req, res) => {
  try {
    const { orderId } = req.body
    const order = await orderModel.findById(orderId)

    if (!order) {
      return res.json({ success: false, message: "Order not found" })
    }

    if (order.status !== "Delivered") {
      return res.json({ success: false, message: "Order cannot be returned at this stage" })
    }

    // Update order status
    order.status = "Return Requested"
    await order.save()

    res.json({ success: true, message: "Return request submitted successfully" })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// New function to handle cancellation request
const requestCancellation = async (req, res) => {
  try {
    const { orderId } = req.body
    const order = await orderModel.findById(orderId)

    if (!order) {
      return res.json({ success: false, message: "Order not found" })
    }

    if (order.status !== "Order Placed" && order.status !== "Processing") {
      return res.json({ success: false, message: "Order cannot be cancelled at this stage" })
    }

    // Update order status to "Cancellation Requested"
    order.status = "Cancellation Requested"
    await order.save()

    res.json({ success: true, message: "Cancellation request submitted successfully" })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export {
  verifyRazorpay,
  verifyStripe,
  placeOrder,
  placeOrderStripe,
  placeOrderRazorpay,
  allOrders,
  userOrders,
  updateStatus,
  deleteOrder,
  cancelOrder,
  returnOrder,
  requestCancellation,
}

