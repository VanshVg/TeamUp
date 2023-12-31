import React, { useEffect, useState } from "react";
import Helmet from "react-helmet";
import DashboardNavbar from "../../components/dashboardNavbar/DashboardNavbar";
import DashboardSidebar from "../../components/dashboardSiderbar/DashboardSidebar";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { ThreeDots } from "react-loader-spinner";
import { useDispatch, useSelector } from "react-redux";
import { setMyTeamsData } from "../../redux/actions/myTeamsActions";

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState({});

  const myTeamsData = useSelector((state) => state.myTeams.myTeamsData);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  let userToken = Cookies.get("userToken");

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_BACKEND_URL}/api/teams/myTeams`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      })
      .then((resp) => {
        dispatch(setMyTeamsData(resp.data.teams));
      })
      .catch((error) => {
        const { status } = error.response;
        if (status === 500) {
          setDashboardError({
            type: "unknown",
            message: "Some unknown error occured! Please try again later.",
          });
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [dispatch]);

  const handleCreateTeam = () => {
    navigate("/CreateTeam");
  };

  const handleJoinTeam = () => {
    navigate("/JoinTeam");
  };

  const handleTeam = (id) => {
    navigate(`/team/${id}`);
  };

  return (
    <>
      <Helmet>
        <title>My Dashboard</title>
      </Helmet>
      <div className="dashboard-container">
        <DashboardNavbar />
        <div className="dashboard">
          <DashboardSidebar />
          {dashboardError.type === "unknown" ? (
            <p
              style={{
                color: "red",
                fontSize: "14px",
                marginTop: "1px",
                marginBottom: "5px",
              }}
            >
              {dashboardError.message}
            </p>
          ) : null}
          {!isLoading ? (
            <div className="dashboard-content">
              {myTeamsData.length > 0 ? (
                <div className="cards-container">
                  {myTeamsData.map((item, index) => (
                    <div className="card" key={index} onClick={() => handleTeam(item._id)}>
                      <div className="upper-row">
                        <h2>{item.name}</h2>
                        <p className="admin-name">{item.admin}</p>
                      </div>
                      <div className="lower-row">
                        <p>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="dashboard-image">
                    <img src="/images/addTeam2.jpg" alt="Create Team"></img>
                  </div>
                  <p className="dashboard-text">
                    You are not part of any team currently so Join or Create a team
                  </p>
                  <div className="dashboard-buttons">
                    <button className="create-team-button" onClick={handleCreateTeam}>
                      Create a Team
                    </button>
                    <button className="join-team-button" onClick={handleJoinTeam}>
                      Join a Team
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="dashboard-loader-container">
              <ThreeDots
                type="ThreeDots"
                height={16}
                width={80}
                radius={9}
                color="#2b60de"
                ariaLabel="three-dots-loading"
                visible={true}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
