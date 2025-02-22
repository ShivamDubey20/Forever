import { useContext, useState, useEffect } from "react"
import Title from "../components/Title"
import CartTotal from "../components/CartTotal"
import { assets } from "../assets/assets"
import { ShopContext } from "../context/ShopContext"
import axios from "axios"
import { toast } from "react-toastify"
import emailjs from "@emailjs/browser"
import { Alert, AlertDescription } from "@/components/ui/alert"

const PlaceOrder = () => {
  const [method, setMethod] = useState("cod")
  const { navigate, backendUrl, token, cartItems, setCartItems, getCartAmount, delivery_fee, products } =
    useContext(ShopContext)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  })
  const [outOfStockItems, setOutOfStockItems] = useState([])

  useEffect(() => {
    // Initialize EmailJS with your public key
    emailjs.init("pXgCM9mdmOzowFIDq")
  }, [])

  const sendOrderConfirmationEmail = async (orderDetails) => {
    try {
      // Format items for email template
      const formattedItems = orderDetails.items
        .map((item) => `${item.name} - Size: ${item.size} - Quantity: ${item.quantity} - Price: $${item.price}`)
        .join("\n")

      // Prepare delivery address string
      const deliveryAddress = `${orderDetails.address.street}, ${orderDetails.address.city}, ${orderDetails.address.state} ${orderDetails.address.zipcode}, ${orderDetails.address.country}`

      const templateParams = {
        to_name: orderDetails.address.firstName,
        from_name: "Your Store Name", // Add your store name here
        email: orderDetails.address.email,
        reply_to: orderDetails.address.email,
        order_number: orderDetails.orderId,
        order_date: new Date().toLocaleDateString(),
        delivery_address: deliveryAddress,
        items: formattedItems,
        subtotal: (orderDetails.amount - delivery_fee).toFixed(2),
        shipping: delivery_fee.toFixed(2),
        total: orderDetails.amount.toFixed(2),
        payment_method: method.toUpperCase(),
      }

      const response = await emailjs.send("service_hfvbwt3", "template_t8vc6yn", templateParams)

      if (response.status === 200) {
        console.log("Order confirmation email sent successfully")
      } else {
        throw new Error("Failed to send email")
      }
    } catch (error) {
      console.error("Failed to send order confirmation email:", error)
      toast.warn("Order placed successfully but confirmation email could not be sent")
    }
  }

  const onChangeHandler = (event) => {
    const name = event.target.name
    const value = event.target.value
    setFormData((data) => ({ ...data, [name]: value }))
  }

  const initPay = (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "Order Payment",
      description: "Order Payment",
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response) => {
        try {
          const { data } = await axios.post(backendUrl + "/api/order/verifyRazorpay", response, { headers: { token } })
          if (data.success) {
            await sendOrderConfirmationEmail({
              orderId: order.receipt,
              address: formData,
              items: getOrderItems(),
              amount: order.amount / 100,
            })
            navigate("/orders")
            setCartItems({})
          }
        } catch (error) {
          console.log(error)
          toast.error(error)
        }
      },
    }
    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  const getOrderItems = () => {
    const orderItems = []
    for (const items in cartItems) {
      for (const item in cartItems[items]) {
        if (cartItems[items][item] > 0) {
          const itemInfo = structuredClone(products.find((product) => product._id === items))
          if (itemInfo) {
            itemInfo.size = item
            itemInfo.quantity = cartItems[items][item]
            orderItems.push(itemInfo)
          }
        }
      }
    }
    return orderItems
  }

  const checkStockAvailability = () => {
    const unavailableItems = []
    for (const items in cartItems) {
      for (const item in cartItems[items]) {
        if (cartItems[items][item] > 0) {
          const product = products.find((p) => p._id === items)
          if (product && product.stock < cartItems[items][item]) {
            unavailableItems.push({
              name: product.name,
              size: item,
              requested: cartItems[items][item],
              available: product.stock,
            })
          }
        }
      }
    }
    setOutOfStockItems(unavailableItems)
    return unavailableItems.length === 0
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    if (!checkStockAvailability()) {
      toast.error("Some items in your cart are out of stock")
      return
    }
    try {
      const orderItems = getOrderItems()
      const orderData = {
        address: formData,
        items: orderItems,
        amount: getCartAmount() + delivery_fee,
      }

      switch (method) {
        case "cod":
          const response = await axios.post(backendUrl + "/api/order/place", orderData, { headers: { token } })
          if (response.data.success) {
            await sendOrderConfirmationEmail({
              orderId: response.data.orderId || "COD-" + Date.now(),
              address: formData,
              items: orderItems,
              amount: orderData.amount,
            })
            setCartItems({})
            navigate("/orders")
          } else {
            toast.error(response.data.message)
          }
          break

        case "stripe":
          const responseStripe = await axios.post(backendUrl + "/api/order/stripe", orderData, { headers: { token } })
          if (responseStripe.data.success) {
            const { session_url } = responseStripe.data
            window.location.replace(session_url)
          } else {
            toast.error(responseStripe.data.message)
          }
          break

        case "razorpay":
          const responseRazorpay = await axios.post(backendUrl + "/api/order/razorpay", orderData, {
            headers: { token },
          })
          if (responseRazorpay.data.success) {
            initPay(responseRazorpay.data.order)
          }
          break

        default:
          break
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t"
    >
      {/* ------------- Left Side ---------------- */}
      <div className="flex flex-col gap-4 w-full sm:max-w-[480px]">
        <div className="text-xl sm:text-2xl my-3">
          <Title text1={"DELIVERY"} text2={"INFORMATION"} />
        </div>
        <div className="flex gap-3">
          <input
            required
            onChange={onChangeHandler}
            name="firstName"
            value={formData.firstName}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="First name"
          />
          <input
            required
            onChange={onChangeHandler}
            name="lastName"
            value={formData.lastName}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="Last name"
          />
        </div>
        <input
          required
          onChange={onChangeHandler}
          name="email"
          value={formData.email}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="email"
          placeholder="Email address"
        />
        <input
          required
          onChange={onChangeHandler}
          name="street"
          value={formData.street}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="text"
          placeholder="Street"
        />
        <div className="flex gap-3">
          <input
            required
            onChange={onChangeHandler}
            name="city"
            value={formData.city}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="City"
          />
          <input
            onChange={onChangeHandler}
            name="state"
            value={formData.state}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="State"
          />
        </div>
        <div className="flex gap-3">
          <input
            required
            onChange={onChangeHandler}
            name="zipcode"
            value={formData.zipcode}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="number"
            placeholder="Zipcode"
          />
          <input
            required
            onChange={onChangeHandler}
            name="country"
            value={formData.country}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="Country"
          />
        </div>
        <input
          required
          onChange={onChangeHandler}
          name="phone"
          value={formData.phone}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="number"
          placeholder="Phone"
        />
      </div>

      {/* ------------- Right Side ------------------ */}
      <div className="mt-8">
        <div className="mt-8 min-w-80">
          <CartTotal />
        </div>

        <div className="mt-12">
          <Title text1={"PAYMENT"} text2={"METHOD"} />
          {/* --------------- Payment Method Selection ------------- */}
          <div className="flex gap-3 flex-col lg:flex-row">
            <div onClick={() => setMethod("stripe")} className="flex items-center gap-3 border p-2 px-3 cursor-pointer">
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === "stripe" ? "bg-green-400" : ""}`}></p>
              <img className="h-5 mx-4" src={assets.stripe_logo || "/placeholder.svg"} alt="" />
            </div>
            <div
              onClick={() => setMethod("razorpay")}
              className="flex items-center gap-3 border p-2 px-3 cursor-pointer"
            >
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === "razorpay" ? "bg-green-400" : ""}`}></p>
              <img className="h-5 mx-4" src={assets.razorpay_logo || "/placeholder.svg"} alt="" />
            </div>
            <div onClick={() => setMethod("cod")} className="flex items-center gap-3 border p-2 px-3 cursor-pointer">
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === "cod" ? "bg-green-400" : ""}`}></p>
              <p className="text-gray-500 text-sm font-medium mx-4">CASH ON DELIVERY</p>
            </div>
          </div>

          <div className="w-full text-end mt-8">
            <button type="submit" className="bg-black text-white px-16 py-3 text-sm">
              PLACE ORDER
            </button>
          </div>
        </div>
      </div>
      {outOfStockItems.length > 0 && (
        <Alert className="bg-red-50 border-red-200 mt-4">
          <AlertDescription className="text-red-800">
            The following items are out of stock or have insufficient quantity:
            <ul className="list-disc list-inside mt-2">
              {outOfStockItems.map((item, index) => (
                <li key={index}>
                  {item.name} (Size: {item.size}) - Requested: {item.requested}, Available: {item.available}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </form>
  )
}

export default PlaceOrder

