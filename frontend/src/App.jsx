import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { LogOut, User, Mail, Shield, Phone, Building2, LayoutDashboard, Wrench, Zap } from "lucide-react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Maintenance from "./pages/Maintenance";
import Amenities from "./pages/Amenities";
import api from "./utility/axiosInstance";

function LandingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="absolute top-[20%] left-[15%] w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[15%] w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="w-full max-w-md text-center z-10 glass rounded-3xl p-10 shadow-2xl">
        <div className="p-4 bg-blue-600/20 border border-blue-500/30 rounded-2xl mb-4 w-fit mx-auto shadow-lg shadow-blue-500/10">
          <Building2 className="w-10 h-10 text-blue-400" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Rentora</h1>
        <p className="text-slate-400 text-sm mb-8">Modern Property & Rental Management Platform</p>
        
        <div className="space-y-4">
          <Link
            to="/login"
            className="block w-full bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl py-3 px-4 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all duration-150 cursor-pointer"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="block w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium rounded-xl py-3 px-4 active:scale-[0.98] transition-all duration-150 cursor-pointer"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}

function HomeRoute() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return null;
  }

  if (!user) {
    return <LandingScreen />;
  }

  return <Dashboard />;
}

function Profile() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white text-zinc-950 w-full min-h-screen flex overflow-visible font-sans">
      <div className="min-h-screen flex w-full">
        {/* Sidebar */}
        <aside className="shrink-0 bg-blue-900 text-white flex p-6 flex-col justify-between w-60 min-h-screen">
          <div className="flex flex-col gap-8">
            <div className="flex px-2 items-center gap-2">
              <div className="size-9 rounded-xl bg-white/15 flex justify-center items-center">
                <Building2 className="size-5 text-white" />
              </div>
              <span className="font-bold text-white text-xl leading-7 tracking-tight">
                Rentora
              </span>
            </div>
            <nav className="flex flex-col gap-1">
              <Link
                to="/"
                className="transition-colors font-medium rounded-lg text-blue-100/80 hover:text-white text-sm leading-5 flex px-3 py-2.5 items-center gap-3 transition-colors"
              >
                <LayoutDashboard className="size-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/maintenance"
                className="transition-colors font-medium rounded-lg text-blue-100/80 hover:text-white text-sm leading-5 flex px-3 py-2.5 items-center gap-3 transition-colors"
              >
                <Wrench className="size-4" />
                <span>Maintenance Requests</span>
              </Link>
              <Link
                to="/amenities"
                className="transition-colors font-medium rounded-lg text-blue-100/80 hover:text-white text-sm leading-5 flex px-3 py-2.5 items-center gap-3 transition-colors"
              >
                <Zap className="size-4" />
                <span>Amenity Booking</span>
              </Link>
              <Link
                to="/profile"
                className="shadow-sm font-semibold rounded-lg bg-[#2b7fff] text-blue-50 text-sm leading-5 flex px-3 py-2.5 items-center gap-3"
              >
                <User className="size-4" />
                <span>Profile</span>
              </Link>
            </nav>
          </div>
          <button
            onClick={handleLogout}
            className="transition-colors font-medium rounded-lg text-blue-100/80 hover:text-white text-sm leading-5 flex px-3 py-2.5 items-center gap-3 cursor-pointer border-none bg-transparent text-left w-full"
          >
            <LogOut className="size-4" />
            <span>Logout</span>
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="bg-slate-50 flex p-8 flex-col flex-1 gap-6 min-h-screen overflow-y-auto items-center justify-center">
          <div className="w-full max-w-xl">
            <div className="bg-white border border-zinc-200 border-solid rounded-3xl p-8 md:p-10 shadow-md">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-600 font-semibold text-2xl">
                  {user.firstname?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-zinc-950">
                    {user.firstname} {user.lastname || ""}
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-700 uppercase tracking-wide inline-block mt-1">
                    {user.role}
                  </span>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-zinc-950 mb-4 border-b border-zinc-100 pb-2">
                Profile Details
              </h3>

              <div className="space-y-4">
                <div className="flex items-center gap-4 py-2">
                  <Mail className="w-5 h-5 text-[#71717b] shrink-0" />
                  <div>
                    <span className="text-xs text-[#71717b] block">Email Address</span>
                    <span className="text-zinc-950 font-medium">{user.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <Phone className="w-5 h-5 text-[#71717b] shrink-0" />
                  <div>
                    <span className="text-xs text-[#71717b] block">Phone Number</span>
                    <span className="text-zinc-950 font-medium">{user.phoneNumber}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 py-2">
                  <Shield className="w-5 h-5 text-[#71717b] shrink-0" />
                  <div>
                    <span className="text-xs text-[#71717b] block">Account Status</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${user.isVerified ? "bg-teal-50 text-teal-700 border border-teal-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                      {user.isVerified ? "Verified" : "Pending Verification"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/amenities" element={<Amenities />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;