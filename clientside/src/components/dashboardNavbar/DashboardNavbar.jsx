import React from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DensitySmallIcon from "@mui/icons-material/DensitySmall";
import "./DashboardNavbar.css";
import { useDispatch } from "react-redux";
import { toggleSidebar } from "../../redux/actions/sidebarActions";
import { useNavigate } from "react-router-dom";

const DashboardNavbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleProfile = () => {
    navigate("/profile");
  };

  return (
    <div>
      <div className="dashboard-navbar">
        <div className="dashboard-navbar-left">
          <div className="sidebar-icon" onClick={() => dispatch(toggleSidebar())}>
            <DensitySmallIcon />
          </div>
        </div>
        <div className="dashboard-navbar-middle">
          <div className="team-up-logo">Team Up</div>
        </div>
        <div className="dashboard-navbar-right">
          <div className="profile-icon">
            <AccountCircleIcon />
          </div>
          <div className="profile-text" onClick={handleProfile}>
            Profile
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardNavbar;
