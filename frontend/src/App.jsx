import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Building2 } from "lucide-react";
import { motion } from "framer-motion";

// Auth pages (keep separate, no sidebar)
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";

// App pages (all use Layout with sidebar)
import Dashboard from "./pages/Dashboard";
import FindProperties from "./pages/FindProperties";
import Properties from "./pages/Properties";
import Maintenance from "./pages/Maintenance";
import Amenities from "./pages/Amenities";
import Bookings from "./pages/Bookings";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";

/* ===================================================
   LANDING SCREEN (unauthenticated)
   =================================================== */
function LandingScreen() {
  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)" }}
    >
      {/* Animated background blobs */}
      <div
        className="absolute w-96 h-96 rounded-full animate-blob"
        style={{ background: "rgba(37,99,235,0.12)", top: "10%", left: "10%", filter: "blur(80px)" }}
      />
      <div
        className="absolute w-80 h-80 rounded-full animate-blob"
        style={{ background: "rgba(79,70,229,0.10)", bottom: "10%", right: "10%", filter: "blur(80px)", animationDelay: "2s" }}
      />
      <div
        className="absolute w-64 h-64 rounded-full animate-blob"
        style={{ background: "rgba(6,182,212,0.08)", top: "40%", right: "20%", filter: "blur(60px)", animationDelay: "4s" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md text-center z-10"
        style={{
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "28px",
          padding: "40px 32px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.4)"
        }}
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
          className="mx-auto mb-6 size-20 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #2563EB, #4F46E5)", boxShadow: "0 16px 48px rgba(37,99,235,0.4)" }}
        >
          <Building2 className="size-10 text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <h1 className="text-5xl font-extrabold text-white mb-2 tracking-tight">Rentora</h1>
          <p className="text-slate-400 text-base mb-2">Premium Property & Rental Management</p>
          <div className="flex items-center justify-center gap-2 mb-10">
            {["Smart", "Modern", "Trusted"].map((t, i) => (
              <span key={t} className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(148,163,184,0.9)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {t}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col gap-3"
        >
          <Link
            to="/login"
            className="block w-full py-3.5 px-6 rounded-2xl font-bold text-white text-center no-underline transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #2563EB, #4F46E5)", boxShadow: "0 8px 32px rgba(37,99,235,0.35)" }}
          >
            Sign In to Rentora
          </Link>
          <Link
            to="/register"
            className="block w-full py-3.5 px-6 rounded-2xl font-bold text-slate-300 text-center no-underline transition-all duration-200 hover:text-white"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Create Account
          </Link>
        </motion.div>

        <p className="text-slate-500 text-xs mt-8">
          Trusted by landlords and tenants across India
        </p>
      </motion.div>
    </div>
  );
}

/* ===================================================
   HOME ROUTE (shows landing or dashboard)
   =================================================== */
function HomeRoute() {
  const [user, setUser] = useState(undefined);
  useEffect(() => {
    const s = localStorage.getItem("user");
    setUser(s ? JSON.parse(s) : null);
  }, []);
  if (user === undefined) return null;
  if (!user) return <LandingScreen />;
  return <Dashboard />;
}

/* ===================================================
   LOGOUT ROUTE
   =================================================== */
function LogoutRoute() {
  const navigate = useNavigate();
  useEffect(() => {
    localStorage.removeItem("user");
    navigate("/login");
  }, [navigate]);
  return null;
}

/* ===================================================
   404 NOT FOUND PAGE
   =================================================== */
function NotFound() {
  const navigate = useNavigate();
  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)" }}
    >
      <div className="absolute w-80 h-80 rounded-full" style={{ background: "rgba(37,99,235,0.10)", top: "15%", left: "15%", filter: "blur(80px)" }} />
      <div className="absolute w-64 h-64 rounded-full" style={{ background: "rgba(79,70,229,0.10)", bottom: "15%", right: "15%", filter: "blur(80px)" }} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center z-10"
        style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "28px", padding: "48px 40px", maxWidth: 420 }}
      >
        <div className="text-7xl font-extrabold mb-4" style={{ background: "linear-gradient(135deg, #2563EB, #4F46E5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>404</div>
        <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
        <p className="text-slate-400 text-sm mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <button
          onClick={() => navigate("/")}
          className="w-full py-3 px-6 rounded-2xl font-bold text-white cursor-pointer border-none transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, #2563EB, #4F46E5)", boxShadow: "0 8px 32px rgba(37,99,235,0.35)" }}
        >
          Back to Rentora
        </button>
      </motion.div>
    </div>
  );
}

/* ===================================================
   APP ROUTER
   =================================================== */
export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/logout" element={<LogoutRoute />} />

        {/* App routes — all use Layout internally */}
        <Route path="/" element={<HomeRoute />} />
        <Route path="/explore" element={<FindProperties />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/my-rentals" element={<FindProperties myRentalsMode={true} />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/amenities" element={<Amenities />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<Admin />} />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}