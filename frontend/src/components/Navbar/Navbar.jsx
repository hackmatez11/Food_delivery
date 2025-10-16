import React, { useContext, useEffect, useRef, useState } from "react";
import "./Navbar.css";
import { assets } from "../../assets/frontend_assets/assets";
import { Link, useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import image from "../../assets/frontend_assets/image.png";

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const { getTotalCartAmount, token, setToken } = useContext(StoreContext);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    toast.success("Logout Successfully");
    navigate("/");
  };

  // Fetch notifications
  useEffect(() => {
    if (token) {
      fetch("/api/notifications") // Change if needed
        .then((res) => res.json())
        .then((data) => setNotifications(data.notifications || []))
        .catch((err) => console.error("Failed to fetch notifications:", err));
    }
  }, [token]);

  // Handle bell click and close on outside click
  useEffect(() => {
    const toggleDropdown = (e) => {
      const dropdown = dropdownRef.current;
      if (!dropdown) return;

      if (e.target.id === "notificationBell") {
        dropdown.style.display =
          dropdown.style.display === "block" ? "none" : "block";
      } else if (!dropdown.contains(e.target)) {
        dropdown.style.display = "none";
      }
    };

    document.addEventListener("click", toggleDropdown);
    return () => document.removeEventListener("click", toggleDropdown);
  }, []);

  return (
    <div className="navbar">
      <Link to="/">
        <img src={image} alt="logo" className="logo" />
      </Link>

      <ul className="navbar-menu">
        <Link
          to="/"
          onClick={() => setMenu("home")}
          className={menu === "home" ? "active" : ""}
        >
          home
        </Link>
        <a
          href="#explore-menu"
          onClick={() => setMenu("menu")}
          className={menu === "menu" ? "active" : ""}
        >
          menu
        </a>
        <a
          href="#app-download"
          onClick={() => setMenu("mobile-app")}
          className={menu === "mobile-app" ? "active" : ""}
        >
          mobile-app
        </a>
        <a
          href="#footer"
          onClick={() => setMenu("contact-us")}
          className={menu === "contact-us" ? "active" : ""}
        >
          contact us
        </a>
      </ul>

      <div className="navbar-right">
        <img src={assets.search_icon} alt="" />

        {/* Notification Bell */}
        {token && (
          <div className="navbar-notification">
            <i className="fa fa-bell" id="notificationBell"></i>
            {notifications.length > 0 && (
              <span className="notification-count">{notifications.length}</span>
            )}

            <div className="notification-dropdown" ref={dropdownRef}>
              <p className="notification-header">Notifications</p>
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <p className="no-notification">No notifications yet.</p>
                ) : (
                  notifications.map((note, index) => (
                    <div key={index} className="notification-item">
                      <strong>{note.title}</strong>
                      <p>{note.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <div className="navbar-search-icon">
          <Link to="/cart">
            <img src={assets.basket_icon} alt="" />
          </Link>
          <div className={getTotalCartAmount() === 0 ? "" : "dot"}></div>
        </div>

        {!token ? (
          <button onClick={() => setShowLogin(true)}>sign in</button>
        ) : (
          <div className="navbar-profile">
            <img src={assets.profile_icon} alt="" />
            <ul className="nav-profile-dropdown">
              <li onClick={() => navigate("/myorders")}>
                <img src={assets.bag_icon} alt="" />
                <p>Orders</p>
              </li>
              <hr />
              <li onClick={logout}>
                <img src={assets.logout_icon} alt="" />
                <p>Logout</p>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
