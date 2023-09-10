import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/dashboard/Dashboard";
import Aboutus from "./pages/aboutus/Aboutus";
import MyTeams from "./pages/myTeams/MyTeams";
import CreateTeam from "./pages/createTeam/CreateTeam";
import JoinTeam from "./pages/joinTeam/JoinTeam";

const App = () => {
  return (
    <>
      <Router>
        <>
          <Routes>
            <Route path="/" element={<Home />}></Route>
            <Route path="/auth/login" element={<Login />}></Route>
            <Route path="/auth/register" element={<Register />}></Route>
            <Route path="/aboutus" element={<Aboutus />}></Route>
            <Route path="/dashboard/home" element={<Dashboard />}></Route>
            <Route path="/dashboard/MyTeams" element={<MyTeams />}></Route>
            <Route path="/dashboard/CreateTeam" element={<CreateTeam />}></Route>
            <Route path="/dashboard/joinTeam" element={<JoinTeam />}></Route>
          </Routes>
        </>
      </Router>
    </>
  );
};

export default App;
