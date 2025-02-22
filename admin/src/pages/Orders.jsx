import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);

  const fetchAllOrders = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const response = await axios.post(`${backendUrl}/api/order/list`, {}, { headers: { token } });
      if (response.data.success) {
        setOrders(response.data.orders.reverse());
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }, [token]);

  const statusHandler = async (event, orderId) => {
    try {
      const newStatus = event.target.value;
      const endpoint = `${backendUrl}/api/order/status`;
      const data = { orderId, status: newStatus };

      if (newStatus === "Cancelled") {
        data.action = "approve_cancellation";
      } else if (newStatus === "Return Approved") {
        data.action = "approve_return";
      }

      const response = await axios.post(endpoint, data, { headers: { token } });

      if (response.data.success) {
        toast.success(`Order ${newStatus.toLowerCase()} successfully`);
        await fetchAllOrders();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const deleteOrderHandler = async (orderId) => {
    try {
      if (!window.confirm("Are you sure you want to delete this order?")) {
        return;
      }

      const response = await axios.delete(`${backendUrl}/api/order/remove/${orderId}`, {
        headers: { token },
      });

      if (response.data.success) {
        toast.success("Order deleted successfully");
        setOrders((prevOrders) => prevOrders.filter((order) => order._id !== orderId));
      } else {
        toast.error(response.data.message || "Error deleting order");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || "Error deleting order");
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, [token, fetchAllOrders]);

  const getStatusOptions = (currentStatus) => {
    const baseOptions = [
      "Order Placed",
      "Packing",
      "Shipped",
      "Out for delivery",
      "Delivered",
      "Cancelled",
    ];

    // Only show Return Approved in dropdown if order is in Return Requested status
    if (currentStatus === "Return Requested") {
      baseOptions.push("Return Approved");
    }

    return baseOptions;
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Order Page</h3>
      <div className="space-y-6">
        {orders.map((order) => (
          <div
            className="grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-4 items-start border border-gray-300 rounded-lg bg-white p-6 shadow-md"
            key={order._id}
          >
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <p key={index} className="text-sm font-medium text-gray-700">
                  {item.name} x {item.quantity} <span className="text-gray-500">{item.size}</span>
                </p>
              ))}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{order.address.firstName + " " + order.address.lastName}</p>
              <p className="text-gray-600">{order.address.street}, {order.address.city}, {order.address.state}, {order.address.country}, {order.address.zipcode}</p>
              <p className="text-gray-600">{order.address.phone}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Items: {order.items.length}</p>
              <p className="text-sm">Method: {order.paymentMethod}</p>
              <p className="text-sm">Payment: <span className={`font-semibold ${order.payment ? 'text-green-600' : 'text-red-600'}`}>{order.payment ? 'Done' : 'Pending'}</span></p>
              <p className="text-sm">Date: {new Date(order.date).toLocaleDateString()}</p>
            </div>
            <p className="text-lg font-semibold text-gray-800">{order.currency}{order.amount}</p>
            <div className="space-y-2">
              <select 
                onChange={(event) => statusHandler(event, order._id)} 
                value={order.status} 
                className="p-2 border border-gray-300 rounded-lg text-gray-700 w-full"
              >
                {getStatusOptions(order.status).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              {order.status === "Cancellation Requested" && (
                <button 
                  className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600" 
                  onClick={() => statusHandler({ target: { value: "Cancelled" } }, order._id)}
                >
                  Approve Cancellation
                </button>
              )}
              {order.status === "Return Requested" && (
                <button 
                  className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600" 
                  onClick={() => statusHandler({ target: { value: "Return Approved" } }, order._id)}
                >
                  Approve Return
                </button>
              )}
              <button 
                className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600" 
                onClick={() => deleteOrderHandler(order._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;