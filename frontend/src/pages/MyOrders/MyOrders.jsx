import React, { useContext, useEffect, useState } from "react";
import "./MyOrders.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { assets } from "../../assets/frontend_assets/assets";

const MyOrders = () => {
  const { url, token } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);
  const [countdowns, setCountdowns] = useState({}); // remaining seconds per order

  // Fetch orders from backend
  const fetchOrders = async () => {
    try {
      const response = await axios.post(
        url + "/api/order/userorders",
        {},
        { headers: { token } }
      );
      if (response.data.success) {
        const data = response.data.data;
        setOrders(data);

        // Initialize countdowns based on startTime + etaMinutes
    const initialCountdowns = {};
data.forEach((order) => {
  if (order.etaMinutes && order.startTime) {
    const finishTime = new Date(order.startTime).getTime() + order.etaMinutes * 60000;
    const remaining = Math.floor((finishTime - Date.now()) / 1000);
    initialCountdowns[order._id] = remaining > 0 ? remaining : 0;
  }
});

        setCountdowns(initialCountdowns);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  };

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdowns((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          if (updated[key] > 0) updated[key] -= 1;
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (token) fetchOrders();
  }, [token]);

  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="my-orders">
      <h2>Orders</h2>
      <div className="container">
        {orders.map((order, index) => (
          <div key={index} className="my-orders-order">
            <img src={assets.parcel_icon} alt="Order Parcel" />
            <p>
              {order.items.map((item, idx) => (
                <span key={idx}>
                  {item.name} X {item.quantity}
                  {idx !== order.items.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
            <p>${order.amount}.00</p>
            <p>items: {order.items.length}</p>
            <p>
              <span>&#x25cf;</span>
              <b> {order.status}</b>
            </p>

            {/* 🔹 Persistent Countdown */}
            {countdowns[order._id] > 0 ? (
              <p>
                ⏱ Time Remaining: <b>{formatTime(countdowns[order._id])}</b> | 👨‍🍳 Chef #{order.assignedChef}
              </p>
            ) : order.status !== "Delivered" ? (
              <p>
                ✅ Ready! | 👨‍🍳 Chef #{order.assignedChef}
              </p>
            ) : (
              <p>
                ✅ Delivered | 👨‍🍳 Chef #{order.assignedChef}
              </p>
            )}

            <button onClick={fetchOrders}>Track Order</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;
