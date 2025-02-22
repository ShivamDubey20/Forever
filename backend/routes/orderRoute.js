import express from "express"
import {
  placeOrder,
  placeOrderStripe,
  placeOrderRazorpay,
  allOrders,
  userOrders,
  updateStatus,
  verifyStripe,
  verifyRazorpay,
  deleteOrder,
  cancelOrder,
  returnOrder,
  requestCancellation,
} from "../controllers/orderController.js"
import adminAuth from "../middleware/adminAuth.js"
import authUser from "../middleware/auth.js"

const orderRouter = express.Router()

// Admin Features
orderRouter.post("/list", adminAuth, allOrders)
orderRouter.post("/status", adminAuth, updateStatus)
orderRouter.delete("/remove/:orderId", adminAuth, deleteOrder)

// Payment Features
orderRouter.post("/place", authUser, placeOrder)
orderRouter.post("/stripe", authUser, placeOrderStripe)
orderRouter.post("/razorpay", authUser, placeOrderRazorpay)

// User Feature
orderRouter.post("/userorders", authUser, userOrders)
orderRouter.post("/cancel", authUser, cancelOrder)
orderRouter.post("/return", authUser, returnOrder)
orderRouter.post("/request-return", authUser, returnOrder)  // Added this route
orderRouter.post("/request-cancellation", authUser, requestCancellation)

// verify payment
orderRouter.post("/verifyStripe", authUser, verifyStripe)
orderRouter.post("/verifyRazorpay", authUser, verifyRazorpay)

export default orderRouter