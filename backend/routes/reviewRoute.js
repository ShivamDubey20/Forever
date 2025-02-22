import express from "express"
import { addReview, getProductReviews, getAllReviews, deleteReview } from "../controllers/reviewController.js"
import authUser from "../middleware/auth.js"
import adminAuth from "../middleware/adminAuth.js"

const reviewRouter = express.Router()

reviewRouter.post("/add", authUser, addReview)
reviewRouter.post("/product", getProductReviews)
reviewRouter.get("/all", adminAuth, getAllReviews)
reviewRouter.post("/delete", adminAuth, deleteReview)

export default reviewRouter

