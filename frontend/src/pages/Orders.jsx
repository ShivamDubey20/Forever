import { useContext, useEffect, useState } from "react"
import { ShopContext } from "../context/ShopContext"
import Title from "../components/Title"
import axios from "axios"
import { toast } from "react-toastify"

const Orders = () => {
  const { token, currency, backendUrl } = useContext(ShopContext)
  const [orderData, setOrderData] = useState([])

  const loadOrderData = async () => {
    try {
      if (!token) return

      const response = await axios.post(`${backendUrl}/api/order/userorders`, {}, { headers: { token } })
      if (response.data.success) {
        const allOrdersItem = []
        response.data.orders.map((order) => {
          order.items.map((item) => {
            item["status"] = order.status
            item["payment"] = order.payment
            item["paymentMethod"] = order.paymentMethod
            item["date"] = order.date
            item["orderId"] = order._id
            item["deliveryAddress"] = order.deliveryAddress
            allOrdersItem.push(item)
          })
        })
        setOrderData(allOrdersItem.reverse())
      } else {
        toast.error(response.data.message || "Failed to load orders")
      }
    } catch (error) {
      console.error("Error loading order data:", error)
      toast.error("Failed to load order data")
    }
  }

  useEffect(() => {
    if (token) {
      loadOrderData()
    }
  }, [token, backendUrl])

  const canRequestCancel = (status) => {
    return ["Order Placed", "Processing"].includes(status)
  }

  const canRequestReturn = (status) => {
    return status === "Delivered"
  }

  const getStatusColor = (status) => {
    const colors = {
      "Order Placed": "bg-blue-500",
      Processing: "bg-yellow-500",
      Shipped: "bg-purple-500",
      Delivered: "bg-green-500",
      Cancelled: "bg-red-500",
      "Cancellation Requested": "bg-orange-500",
      "Return Requested": "bg-pink-500",
      "Return Approved": "bg-teal-500",
    }
    return colors[status] || "bg-gray-500"
  }

  const handleCancelRequest = async (orderId) => {
    try {
      if (!window.confirm("Are you sure you want to cancel this order?")) {
        return
      }

      const response = await axios.post(
        `${backendUrl}/api/order/request-cancellation`,
        { orderId },
        { headers: { token } },
      )

      if (response.data.success) {
        toast.success("Cancellation request submitted")
        loadOrderData()
      } else {
        toast.error(response.data.message || "Failed to request cancellation")
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error processing request")
    }
  }

  const handleReturnRequest = async (orderId) => {
    try {
      if (!window.confirm("Are you sure you want to return this order?")) {
        return
      }

      const response = await axios.post(`${backendUrl}/api/order/request-return`, { orderId }, { headers: { token } })

      if (response.data.success) {
        toast.success("Return request submitted")
        loadOrderData()
      } else {
        toast.error(response.data.message || "Failed to request return")
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error processing request")
    }
  }

  return (
    <div className="border-t pt-16">
      <div className="text-2xl">
        <Title text1={"MY"} text2={"ORDERS"} />
      </div>

      {orderData.length === 0 && <div className="text-center py-10 text-gray-500">No orders found</div>}

      <div>
        {orderData.map((item, index) => (
          <div
            key={index}
            className="py-4 border-t border-b text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div className="flex items-start gap-6 text-sm">
              <img className="w-16 sm:w-20 object-cover" src={item.image[0] || "/placeholder.svg"} alt={item.name} />
              <div>
                <p className="sm:text-base font-medium">{item.name}</p>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-base text-gray-700">
                  <p>
                    {currency}
                    {item.price}
                  </p>
                  <p>Quantity: {item.quantity}</p>
                  <p>Size: {item.size}</p>
                </div>
                <p className="mt-1">
                  Date: <span className="text-gray-400">{new Date(item.date).toLocaleDateString()}</span>
                </p>
                <p className="mt-1">
                  Payment: <span className="text-gray-400">{item.paymentMethod}</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">Order ID: {item.orderId}</p>
                <p className="mt-1 text-xs text-gray-500">Delivery Address: {item.deliveryAddress}</p>
              </div>
            </div>

            <div className="md:w-1/2 flex flex-col md:flex-row justify-between gap-2">
              <div className="flex items-center gap-2">
                <p className={`w-2 h-2 rounded-full ${getStatusColor(item.status)}`}></p>
                <p className="text-sm md:text-base">{item.status}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {canRequestCancel(item.status) && (
                  <button
                    onClick={() => handleCancelRequest(item.orderId)}
                    className="border border-red-500 text-red-500 px-4 py-2 text-sm font-medium rounded-sm hover:bg-red-50 transition-colors"
                  >
                    Cancel Order
                  </button>
                )}

                {canRequestReturn(item.status) && (
                  <button
                    onClick={() => handleReturnRequest(item.orderId)}
                    className="border border-orange-500 text-orange-500 px-4 py-2 text-sm font-medium rounded-sm hover:bg-orange-50 transition-colors"
                  >
                    Return Order
                  </button>
                )}

                <button
                  onClick={loadOrderData}
                  className="border px-4 py-2 text-sm font-medium rounded-sm hover:bg-gray-50 transition-colors"
                >
                  Refresh Status
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Orders

