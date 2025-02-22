"use client"

import { useContext, useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ShopContext } from "../context/ShopContext"
import { assets } from "../assets/assets"
import RelatedProducts from "../components/RelatedProducts"
import axios from "axios"
import { backendUrl } from "../../../admin/src/App"
import { toast } from "react-toastify"

const Product = () => {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { products, currency, addToCart } = useContext(ShopContext)
  const [productData, setProductData] = useState(false)
  const [image, setImage] = useState("")
  const [size, setSize] = useState("")
  const [reviews, setReviews] = useState([])
  const [userReview, setUserReview] = useState({ rating: 5, comment: "" })
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [averageRating, setAverageRating] = useState(0)
  const [showReviews, setShowReviews] = useState(false)

  const fetchReviews = async () => {
    try {
      const response = await axios.post(backendUrl + "/api/review/product", {
        productId,
      })
      if (response.data.success) {
        const reviewData = response.data.reviews
        setReviews(reviewData)
        
        // Calculate average rating
        if (reviewData.length > 0) {
          const totalRating = reviewData.reduce((sum, review) => sum + review.rating, 0)
          setAverageRating(Math.round((totalRating / reviewData.length) * 10) / 10)
        } else {
          setAverageRating(0)
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  const submitReview = async (e) => {
    e.preventDefault()
    if (!isLoggedIn) {
      toast.error("Please login to submit a review")
      return
    }

    try {
      const response = await axios.post(
        backendUrl + "/api/review/add",
        {
          productId,
          rating: userReview.rating,
          comment: userReview.comment,
        },
        {
          headers: { token: localStorage.getItem("token") },
        },
      )

      if (response.data.success) {
        toast.success("Review submitted successfully")
        setUserReview({ rating: 5, comment: "" })
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
    setIsLoggedIn(!!localStorage.getItem("token"))
  }, [productId])

  const fetchProductData = async () => {
    products.map((item) => {
      if (item._id === productId) {
        setProductData(item)
        setImage(item.image[0])
        return null
      }
    })
  }

  useEffect(() => {
    fetchProductData()
  }, [productId, products])

  // Function to render star rating
  const renderStarRating = (rating) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating - fullStars >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="text-yellow-500">★</span>
        ))}
        {hasHalfStar && (
          <span className="text-yellow-500">★</span>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="text-gray-300">★</span>
        ))}
      </div>
    )
  }

  return productData ? (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-w-4 aspect-h-3 bg-gray-100 rounded-lg overflow-hidden">
            <img 
              src={image || "/placeholder.svg"} 
              alt={productData.name}
              className="w-full h-full object-center object-cover"
            />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {productData.image.map((img, index) => (
              <button
                key={index}
                onClick={() => setImage(img)}
                className={`aspect-w-1 aspect-h-1 rounded-md overflow-hidden ${
                  img === image ? "ring-2 ring-black" : "ring-1 ring-gray-200"
                }`}
              >
                <img
                  src={img || "/placeholder.svg"}
                  alt={`${productData.name} - view ${index + 1}`}
                  className="w-full h-full object-center object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li><a href="/" className="hover:text-gray-900">Home</a></li>
              <li>/</li>
              <li><a href={`/category/${productData.category}`} className="hover:text-gray-900">{productData.category}</a></li>
              <li>/</li>
              <li className="font-medium text-gray-900">{productData.name}</li>
            </ol>
          </nav>

          <h1 className="text-3xl font-bold text-gray-900">{productData.name}</h1>
          
          <div className="flex items-center mt-2 mb-4">
            {renderStarRating(averageRating)}
            <span className="ml-2 text-sm text-gray-500">
              {averageRating} out of 5 ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
            </span>
          </div>

          <p className="text-3xl font-bold text-gray-900 mt-2">
            {currency}{productData.price}
          </p>

          <div className="border-t border-b border-gray-200 my-8 py-6">
            <h3 className="font-medium text-gray-900 mb-4">Description</h3>
            <p className="text-gray-700 leading-relaxed">{productData.description}</p>
          </div>

          <div className="mb-8">
            <h3 className="font-medium text-gray-900 mb-4">Select Size</h3>
            <div className="grid grid-cols-4 gap-2">
              {productData.sizes.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setSize(item)}
                  className={`py-3 text-sm font-medium rounded-md transition-colors
                    ${item === size 
                      ? "bg-black text-white" 
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => addToCart(productData._id, size)}
            disabled={!size}
            className={`w-full py-4 rounded-md text-center font-medium text-white transition-colors
              ${size 
                ? "bg-black hover:bg-gray-800" 
                : "bg-gray-300 cursor-not-allowed"
              }`}
          >
            {size ? "ADD TO CART" : "SELECT A SIZE"}
          </button>

          <div className="mt-8 space-y-6">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-gray-700">Free shipping on orders over $100</p>
            </div>
            <div className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-gray-700">Easy 30-day returns</p>
            </div>
            <div className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-gray-700">100% authentic products</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16 border-t border-gray-200 pt-16">
        <button
          onClick={() => setShowReviews(!showReviews)}
          className="flex w-full justify-between items-center py-3 text-left focus:outline-none"
        >
          <h2 className="text-2xl font-bold text-gray-900">Customer Reviews ({reviews.length})</h2>
          <svg 
            className={`h-6 w-6 transform ${showReviews ? 'rotate-180' : ''} transition-transform`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showReviews && (
          <div className="mt-8 space-y-8">
            {/* Review Form */}
            {!isLoggedIn ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Share Your Experience</h3>
                <p className="text-gray-600 mb-6">Sign in to leave a review for this product</p>
                <button 
                  onClick={() => navigate("/login")} 
                  className="bg-black text-white px-6 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors"
                >
                  SIGN IN
                </button>
              </div>
            ) : (
              <form onSubmit={submitReview} className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Write a Review</h3>
                
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">Give Your Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setUserReview((prev) => ({ ...prev, rating }))}
                        className="text-2xl focus:outline-none"
                      >
                        <span className={rating <= userReview.rating ? "text-yellow-400" : "text-gray-300"}>★</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="review-comment" className="block text-gray-700 font-medium mb-2">
                    Give Your Review
                  </label>
                  <textarea
                    id="review-comment"
                    value={userReview.comment}
                    onChange={(e) => setUserReview((prev) => ({ ...prev, comment: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                    rows={4}
                    placeholder="Share your experience with this product..."
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="bg-black text-white px-6 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors"
                >
                  SUBMIT REVIEW
                </button>
              </form>
            )}

            {/* Review List */}
            {reviews.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {reviews.map((review, index) => (
                  <div key={index} className="py-8">
                    <div className="flex items-start">
                      <div className="mr-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-800 font-bold text-xl">
                          {review.userName.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900">{review.userName}</h4>
                          <span className="text-sm text-gray-500">
                            {new Date(review.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex mb-3">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < review.rating ? "text-yellow-400" : "text-gray-300"}>
                              ★
                            </span>
                          ))}
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No Reviews Yet</h3>
                <p className="mt-1 text-gray-500">Be the first to share your experience with this product.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Related Products Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">You May Also Like</h2>
        <RelatedProducts category={productData.category} subCategory={productData.subCategory} />
      </div>
    </div>
  ) : (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
    </div>
  )
}

export default Product