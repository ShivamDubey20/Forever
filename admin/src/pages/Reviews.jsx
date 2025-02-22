"use client"

import axios from "axios"
import { useEffect, useState, useCallback } from "react"
import { backendUrl } from "../App"
import { toast } from "react-toastify"
import { Star } from "lucide-react"

const Reviews = ({ token }) => {
  const [reviews, setReviews] = useState([])

  const fetchReviews = useCallback(async () => {
    try {
      const response = await axios.get(backendUrl + "/api/review/all", {
        headers: { token },
      })
      if (response.data.success) {
        setReviews(response.data.reviews.reverse())
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }, [token])

  const deleteReview = async (reviewId) => {
    try {
      const response = await axios.post(backendUrl + "/api/review/delete", { reviewId }, { headers: { token } })

      if (response.data.success) {
        toast.success(response.data.message)
        await fetchReviews()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  return (
    <>
      <p className="mb-2">Product Reviews</p>
      <div className="flex flex-col gap-2">
        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm">
          <b>Comment</b>
          <b>Product</b>
          <b>User</b>
          <b>Rating</b>
          <b className="text-center">Action</b>
        </div>

        {reviews.map((review, index) => (
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-2 py-1 px-2 border text-sm" key={index}>
            <p>{review.comment}</p>
            <p>{review.productId}</p>
            <p>{review.userName}</p>
            <div className="flex items-center gap-1">
              {[...Array(review.rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p onClick={() => deleteReview(review._id)} className="text-right md:text-center cursor-pointer text-lg">
              X
            </p>
          </div>
        ))}
      </div>
    </>
  )
}

export default Reviews

