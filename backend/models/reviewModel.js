import mongoose from "mongoose"

const reviewSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  productId: { type: String, required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  date: { type: Number, required: true },
})

const reviewModel = mongoose.models.review || mongoose.model("review", reviewSchema)

export default reviewModel

