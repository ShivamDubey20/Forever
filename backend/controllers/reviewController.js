import reviewModel from "../models/reviewModel.js"
import userModel from "../models/userModel.js"

// Add a review
const addReview = async (req, res) => {
  try {
    const { userId, productId, rating, comment } = req.body

    // Get user name
    const user = await userModel.findById(userId)
    if (!user) {
      return res.json({ success: false, message: "User not found" })
    }

    const reviewData = {
      userId,
      productId,
      userName: user.name,
      rating: Number(rating),
      comment,
      date: Date.now(),
    }

    const review = new reviewModel(reviewData)
    await review.save()

    res.json({ success: true, message: "Review Added" })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// Get reviews for a product
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.body
    const reviews = await reviewModel.find({ productId })
    res.json({ success: true, reviews })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// Get all reviews (for admin)
const getAllReviews = async (req, res) => {
  try {
    const reviews = await reviewModel.find({})
    res.json({ success: true, reviews })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// Delete a review (admin only)
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.body
    await reviewModel.findByIdAndDelete(reviewId)
    res.json({ success: true, message: "Review Deleted" })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { addReview, getProductReviews, getAllReviews, deleteReview }

