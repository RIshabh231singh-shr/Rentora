import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Search,
  MapPin,
  Star,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Flame,
  Zap,
  Home,
  Heart,
  Menu,
  X,
  SlidersHorizontal,
  CheckCircle2,
  ArrowDown,
  Lock,
  PhoneCall,
  KeyRound,
  Sun,
  Moon
} from "lucide-react";

// Curated high quality property images
const FEATURED_PROPERTIES = [
  {
    id: "prop-1",
    title: "The Marine View Penthouse",
    location: "Marine Drive, Mumbai",
    city: "Mumbai",
    price: "₹95,000",
    period: "/month",
    type: "4 BHK Penthouse",
    rating: 4.98,
    reviews: 124,
    tag: "Most Booked",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
    badgeColor: "bg-blue-600 text-white font-bold"
  },
  {
    id: "prop-2",
    title: "Baga Luxury Pool Villa",
    location: "Baga Beach, Goa",
    city: "Goa",
    price: "₹65,000",
    period: "/month",
    type: "3 BHK Villa",
    rating: 4.95,
    reviews: 98,
    tag: "Hot Deal",
    image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80",
    badgeColor: "bg-rose-500 text-white font-bold"
  },
  {
    id: "prop-3",
    title: "Indiranagar Smart Studio",
    location: "Indiranagar, Bangalore",
    city: "Bangalore",
    price: "₹38,000",
    period: "/month",
    type: "2 BHK Apartment",
    rating: 4.91,
    reviews: 86,
    tag: "Top Rated",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
    badgeColor: "bg-cyan-600 text-white font-bold"
  },
  {
    id: "prop-4",
    title: "Cyber Heights Executive Suite",
    location: "DLF Phase 5, Gurgaon",
    city: "Gurgaon",
    price: "₹52,000",
    period: "/month",
    type: "3 BHK Luxury Flat",
    rating: 4.89,
    reviews: 64,
    tag: "Trending",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    badgeColor: "bg-emerald-600 text-white font-bold"
  },
  {
    id: "prop-5",
    title: "Bandra Glasshouse Duplex",
    location: "Pali Hill, Mumbai",
    city: "Mumbai",
    price: "₹82,000",
    period: "/month",
    type: "3 BHK Duplex",
    rating: 4.97,
    reviews: 142,
    tag: "Verified",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    badgeColor: "bg-indigo-600 text-white font-bold"
  },
  {
    id: "prop-6",
    title: "Koregaon Park Garden Flat",
    location: "Koregaon Park, Pune",
    city: "Pune",
    price: "₹34,000",
    period: "/month",
    type: "2 BHK Garden Suite",
    rating: 4.93,
    reviews: 73,
    tag: "Peaceful",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
    badgeColor: "bg-teal-600 text-white font-bold"
  }
];

// Popular cities dataset
const POPULAR_LOCATIONS = [
  { name: "Mumbai", count: "Financial Capital & Sea Views", img: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=400&q=80" },
  { name: "Bangalore", count: "Tech Hub & Smart Studios", img: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=400&q=80" },
  { name: "Delhi NCR", count: "Capital Region & Penthouses", img: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=400&q=80" },
  { name: "Goa", count: "Beachfront & Private Villas", img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=400&q=80" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  // Theme toggle state (defaulting to Light Mode for crisp modern feel, can toggle to Dark Mode)
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState("Mumbai");
  const [propertyType, setPropertyType] = useState("All Types");
  const [promptModal, setPromptModal] = useState({ open: false, title: "", message: "" });
  const [likedMap, setLikedMap] = useState({});

  // Prompt sign in for any action on landing page
  const handleAction = (message = "Please sign in or create an account to view property details and make bookings.") => {
    setPromptModal({
      open: true,
      title: "Authentication Required",
      message: message
    });
  };

  const handleHeartClick = (e, id) => {
    e.stopPropagation();
    setLikedMap(prev => ({ ...prev, [id]: !prev[id] }));
    handleAction("Sign in to save your favorite rental properties to your wishlist!");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate("/register", { state: { from: "search", city: selectedCity, type: propertyType } });
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden transition-colors duration-300 ${
      isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] ${
          isDark ? "bg-blue-600/15" : "bg-blue-500/10"
        }`} />
        <div className={`absolute top-1/3 right-10 w-[450px] h-[450px] rounded-full blur-[140px] ${
          isDark ? "bg-indigo-600/15" : "bg-indigo-500/10"
        }`} />
        <div className={`absolute bottom-10 left-1/3 w-[600px] h-[600px] rounded-full blur-[160px] ${
          isDark ? "bg-cyan-500/10" : "bg-cyan-400/10"
        }`} />
      </div>

      {/* =========================================================
          NAVIGATION HEADER
         ========================================================= */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
        isDark 
          ? "bg-slate-950/85 border-slate-800/80" 
          : "bg-white/85 border-slate-200 shadow-sm"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="size-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-600/25 group-hover:scale-105 transition-transform">
              <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${
                isDark ? "bg-slate-950" : "bg-white"
              }`}>
                <Building2 className="size-6 text-blue-600 group-hover:text-cyan-500 transition-colors" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className={`text-2xl font-black tracking-tight flex items-center gap-1 ${
                isDark ? "text-white" : "text-slate-900"
              }`}>
                RENTORA <span className="size-2 rounded-full bg-blue-500 inline-block animate-pulse"></span>
              </span>
              <span className={`text-[10px] font-bold tracking-wider uppercase -mt-1 ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}>
                Luxury Living & Rentals
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className={`hidden md:flex items-center gap-8 font-semibold text-sm ${
            isDark ? "text-slate-300" : "text-slate-600"
          }`}>
            <a href="#hero" className={`transition-colors ${isDark ? "hover:text-white" : "hover:text-blue-600"}`}>Home</a>
            <a href="#featured" className={`transition-colors ${isDark ? "hover:text-white" : "hover:text-blue-600"}`}>Featured Homes</a>
            <a href="#locations" className={`transition-colors ${isDark ? "hover:text-white" : "hover:text-blue-600"}`}>Top Cities</a>
            <a href="#why-us" className={`transition-colors ${isDark ? "hover:text-white" : "hover:text-blue-600"}`}>Why Rentora</a>
            <a href="#features" className={`transition-colors ${isDark ? "hover:text-white" : "hover:text-blue-600"}`}>Features</a>
          </nav>

          {/* Theme Toggle & Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle Switch */}
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2.5 rounded-xl border flex items-center gap-2 font-bold text-xs transition-all ${
                isDark 
                  ? "bg-slate-900 border-slate-800 text-cyan-400 hover:bg-slate-800" 
                  : "bg-slate-100 border-slate-200 text-blue-700 hover:bg-slate-200"
              }`}
              title="Toggle Theme"
            >
              {isDark ? (
                <>
                  <Sun className="size-4 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="size-4 text-indigo-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            <Link
              to="/login"
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                isDark 
                  ? "text-slate-300 hover:text-white hover:bg-slate-900" 
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-xl border ${
                isDark ? "bg-slate-900 border-slate-800 text-cyan-400" : "bg-slate-100 border-slate-200 text-blue-600"
              }`}
            >
              {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-xl border ${
                isDark ? "text-slate-300 hover:bg-slate-900 border-slate-800" : "text-slate-700 hover:bg-slate-100 border-slate-200"
              }`}
            >
              {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`md:hidden border-b px-4 pt-4 pb-6 space-y-4 ${
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-lg"
              }`}
            >
              <div className={`flex flex-col gap-3 font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                <a href="#hero" onClick={() => setMobileMenuOpen(false)} className="py-2">Home</a>
                <a href="#featured" onClick={() => setMobileMenuOpen(false)} className="py-2">Featured Homes</a>
                <a href="#locations" onClick={() => setMobileMenuOpen(false)} className="py-2">Top Cities</a>
                <a href="#why-us" onClick={() => setMobileMenuOpen(false)} className="py-2">Why Rentora</a>
              </div>
              <div className={`pt-4 border-t flex flex-col gap-3 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                <Link
                  to="/login"
                  className={`w-full text-center py-3 rounded-xl font-bold ${
                    isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-800"
                  }`}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="w-full text-center py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md"
                >
                  Sign Up Free
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* =========================================================
          HERO SECTION (ELEVATED BLUE/INDIGO/CYAN MOSAIC GRID & TYPOGRAPHY)
         ========================================================= */}
      <section id="hero" className="relative z-10 pt-8 pb-16 lg:pt-14 lg:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* LEFT SIDE: MOSAIC PHOTO GRID (Sophisticated Brand Palette matching reference screenshot layout) */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-6 relative"
          >
            {/* Artistic Grid Container */}
            <div className={`grid grid-cols-4 grid-rows-4 gap-2.5 sm:gap-3 p-3.5 rounded-3xl border shadow-2xl backdrop-blur-xl aspect-square max-w-[500px] mx-auto lg:max-w-none ${
              isDark ? "bg-slate-900/70 border-slate-800/80" : "bg-white/90 border-slate-200/90 shadow-slate-200/80"
            }`}>

              {/* Row 1 */}
              <div className="col-span-1 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 rounded-2xl flex items-center justify-center font-black text-white text-xs sm:text-sm shadow-md shadow-blue-600/25">
                RENT
              </div>
              <div className="col-span-3 row-span-2 overflow-hidden rounded-2xl relative group">
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=80"
                  alt="Modern Living"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-3">
                  <span className="text-xs font-bold text-white bg-blue-600/90 backdrop-blur-md px-3 py-1 rounded-full">
                    Luxury Stays
                  </span>
                </div>
              </div>

              {/* Row 2 */}
              <div className="col-span-1 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-2xl p-2 flex flex-col items-center justify-center text-center shadow-md">
                <Sparkles className="size-5 text-white mb-1" />
                <span className="text-[10px] font-black text-white uppercase tracking-tighter">VIP HOUSING</span>
              </div>

              {/* Row 3 */}
              <div className="col-span-1 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-md">
                <Building2 className="size-6 text-white" />
              </div>
              <div className="col-span-2 row-span-2 overflow-hidden rounded-2xl relative group">
                <img
                  src="https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=600&q=80"
                  alt="Villa Pool"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute bottom-2 left-2 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] font-bold text-cyan-400">
                  ★ 4.98 Top Rating
                </div>
              </div>
              <div className="col-span-1 overflow-hidden rounded-2xl relative group">
                <img
                  src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80"
                  alt="Penthouse"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>

              {/* Row 4 */}
              <div className="col-span-1 overflow-hidden rounded-2xl relative group">
                <img
                  src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80"
                  alt="Modern Studio"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <div className="col-span-1 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-md">
                100% VERIFIED
              </div>
            </div>

            {/* Floating Decorative Square Arrow Icon (Blue Gradient box) */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="absolute -bottom-6 -left-4 sm:-bottom-8 sm:left-4 z-20"
            >
              <a
                href="#featured"
                className={`size-16 sm:size-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl hover:from-blue-500 hover:to-indigo-500 transition-colors group cursor-pointer ${
                  isDark ? "border-4 border-slate-950" : "border-4 border-slate-50"
                }`}
              >
                <ArrowDown className="size-7 text-white group-hover:translate-y-1 transition-transform" />
              </a>
            </motion.div>

            {/* Floating Trust Badge */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className={`hidden sm:flex absolute -top-4 -right-2 sm:-top-6 sm:right-0 backdrop-blur-xl border p-3.5 sm:p-4 rounded-2xl shadow-2xl items-center gap-3 ${
                isDark ? "bg-slate-900/90 border-slate-700/80 text-white" : "bg-white/95 border-slate-200 text-slate-900"
              }`}
            >
              <div className="size-10 rounded-xl bg-blue-600/15 text-blue-600 flex items-center justify-center font-bold">
                <ShieldCheck className="size-6 text-blue-600" />
              </div>
              <div>
                <p className={`text-xs font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>Trusted Platform</p>
                <p className={`text-sm font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>Verified Property Network</p>
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT SIDE: BOLD TYPOGRAPHY & HEADLINE */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-6 flex flex-col justify-center"
          >
            {/* Top Highlight Tag */}
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider w-fit mb-6 ${
              isDark 
                ? "bg-blue-600/15 border-blue-500/30 text-blue-400" 
                : "bg-blue-50 border-blue-200 text-blue-700"
            }`}>
              <Flame className="size-4 text-blue-600" />
              The Next-Gen Rental Experience
            </div>

            {/* Giant Title (Screenshot Style Bold Font) */}
            <h1 className={`text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] uppercase mb-6 ${
              isDark ? "text-white" : "text-slate-950"
            }`}>
              RENTAL <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                CULTURE
              </span>
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-8">
              <div className="sm:col-span-7">
                <p className={`text-base sm:text-lg leading-relaxed font-normal ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}>
                  Delightful, premium properties curated for modern living. Rent fully verified luxury apartments, sea-view penthouses, and villa suites with zero brokerage hassles.
                </p>
              </div>
              <div className={`sm:col-span-5 border-l-2 pl-4 flex flex-col justify-center ${
                isDark ? "border-slate-800" : "border-slate-300"
              }`}>
                <p className={`text-xs leading-relaxed font-medium ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}>
                  Verified landlords, instant digital rental agreements, smart rent payments, and 24/7 maintenance support built in.
                </p>
                <button
                  onClick={() => handleAction("Explore detailed rental terms and verified host guarantees!")}
                  className="text-xs text-blue-600 dark:text-blue-400 font-extrabold hover:underline mt-2 flex items-center gap-1 text-left"
                >
                  Read More <ChevronRight className="size-3" />
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-blue-600/30 flex items-center gap-3 transition-all hover:scale-105 active:scale-95"
              >
                EXPLORE COLLECTION
                <ArrowRight className="size-5" />
              </Link>

              <button
                onClick={() => handleAction("Sign up as a Landlord to list your property and earn automated rent!")}
                className={`px-7 py-4 font-bold text-sm rounded-2xl border flex items-center gap-2 transition-all ${
                  isDark 
                    ? "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800" 
                    : "bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm"
                }`}
              >
                <Building2 className="size-4 text-blue-600" />
                List Your Property
              </button>
            </div>
          </motion.div>

        </div>

        {/* =========================================================
            INTERACTIVE SEARCH BAR (CORRESPONDING LIGHT / DARK)
           ========================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className={`mt-16 backdrop-blur-2xl border rounded-3xl p-4 sm:p-6 shadow-2xl ${
            isDark 
              ? "bg-slate-900/90 border-slate-800 text-white" 
              : "bg-white/90 border-slate-200 text-slate-900 shadow-slate-200/80"
          }`}
        >
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-center">

            {/* Location selector */}
            <div className={`lg:col-span-4 rounded-2xl p-3 border transition-colors ${
              isDark ? "bg-slate-950/70 border-slate-800 hover:border-blue-600/50" : "bg-slate-50 border-slate-200 hover:border-blue-500"
            }`}>
              <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1 flex items-center gap-1.5 ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}>
                <MapPin className="size-3.5 text-blue-600" /> City / Location
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className={`w-full bg-transparent font-bold text-sm focus:outline-none cursor-pointer ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                <option value="Mumbai" className={isDark ? "bg-slate-900" : "bg-white"}>Mumbai (Marine Drive, Bandra, Powai)</option>
                <option value="Bangalore" className={isDark ? "bg-slate-900" : "bg-white"}>Bangalore (Indiranagar, Koramangala, HSR)</option>
                <option value="Delhi NCR" className={isDark ? "bg-slate-900" : "bg-white"}>Delhi NCR (Gurgaon, South Delhi, Noida)</option>
                <option value="Goa" className={isDark ? "bg-slate-900" : "bg-white"}>Goa (Baga, Anjuna, Panaji)</option>
                <option value="Pune" className={isDark ? "bg-slate-900" : "bg-white"}>Pune (Koregaon Park, Viman Nagar)</option>
              </select>
            </div>

            {/* Property type */}
            <div className={`lg:col-span-4 rounded-2xl p-3 border transition-colors ${
              isDark ? "bg-slate-950/70 border-slate-800 hover:border-blue-600/50" : "bg-slate-50 border-slate-200 hover:border-blue-500"
            }`}>
              <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1 flex items-center gap-1.5 ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}>
                <Home className="size-3.5 text-indigo-600" /> Category & Type
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className={`w-full bg-transparent font-bold text-sm focus:outline-none cursor-pointer ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                <option value="All Types" className={isDark ? "bg-slate-900" : "bg-white"}>All Rentals (Apartments, Penthouses, Villas)</option>
                <option value="Penthouse" className={isDark ? "bg-slate-900" : "bg-white"}>Luxury Penthouses</option>
                <option value="Villa" className={isDark ? "bg-slate-900" : "bg-white"}>Beachfront & Private Villas</option>
                <option value="Apartment" className={isDark ? "bg-slate-900" : "bg-white"}>Modern Smart Apartments</option>
                <option value="Studio" className={isDark ? "bg-slate-900" : "bg-white"}>Executive Studios</option>
              </select>
            </div>

            {/* Price Budget */}
            <div className={`lg:col-span-2 rounded-2xl p-3 border transition-colors ${
              isDark ? "bg-slate-950/70 border-slate-800 hover:border-blue-600/50" : "bg-slate-50 border-slate-200 hover:border-blue-500"
            }`}>
              <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1 flex items-center gap-1.5 ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}>
                <SlidersHorizontal className="size-3.5 text-cyan-500" /> Monthly Range
              </label>
              <span className={`text-sm font-extrabold block ${isDark ? "text-slate-200" : "text-slate-800"}`}>₹20k – ₹1.5L+</span>
            </div>

            {/* Search CTA */}
            <div className="lg:col-span-2">
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Search className="size-5 text-white" />
                Find Homes
              </button>
            </div>

          </form>
        </motion.div>

      </section>

      {/* =========================================================
          FEATURED & MOST BOOKED PROPERTIES SECTION
         ========================================================= */}
      <section id="featured" className={`py-20 border-t border-b relative ${
        isDark ? "bg-slate-900/50 border-slate-800/60" : "bg-slate-100/70 border-slate-200"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest mb-2">
                <Sparkles className="size-4" /> Handpicked Rentals
              </div>
              <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                isDark ? "text-white" : "text-slate-950"
              }`}>
                Most Booked & Hot Properties
              </h2>
              <p className={`text-sm mt-2 max-w-xl ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Explore top-tier verified properties across India with high tenant ratings, modern amenities, and prime city locations.
              </p>
            </div>

            <button
              onClick={() => handleAction("Sign in to explore all available rental properties across India!")}
              className="mt-4 md:mt-0 flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm group cursor-pointer"
            >
              View All Properties <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURED_PROPERTIES.map((prop) => (
              <motion.div
                key={prop.id}
                whileHover={{ y: -8 }}
                onClick={() => handleAction(`Sign in to view full property details, photos, and book "${prop.title}"!`)}
                className={`rounded-3xl overflow-hidden border shadow-xl hover:shadow-2xl transition-all cursor-pointer group flex flex-col ${
                  isDark ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:border-slate-300 shadow-slate-200/60"
                }`}
              >
                {/* Property Image Container */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={prop.image}
                    alt={prop.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs uppercase tracking-wider ${prop.badgeColor} shadow-md`}>
                      {prop.tag}
                    </span>
                  </div>

                  {/* Wishlist Heart Button */}
                  <button
                    onClick={(e) => handleHeartClick(e, prop.id)}
                    className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-950/60 backdrop-blur-md text-slate-300 hover:text-rose-500 hover:bg-slate-950 transition-colors shadow-lg"
                  >
                    <Heart className={`size-5 ${likedMap[prop.id] ? "fill-rose-500 text-rose-500" : ""}`} />
                  </button>

                  {/* Price overlay on image bottom */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-black text-white">{prop.price}</span>
                      <span className="text-xs text-slate-200 font-medium">{prop.period}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-xs font-bold text-amber-400">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" />
                      {prop.rating} ({prop.reviews})
                    </div>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className={`flex items-center gap-1.5 text-xs font-semibold mb-1 ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}>
                      <MapPin className="size-3.5 text-blue-600" />
                      {prop.location}
                    </div>
                    <h3 className={`text-xl font-extrabold mb-2 group-hover:text-blue-600 transition-colors ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}>
                      {prop.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                        isDark ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}>
                        {prop.type}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                        Instant Booking
                      </span>
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className={`pt-4 border-t flex items-center justify-between ${
                    isDark ? "border-slate-800/80" : "border-slate-100"
                  }`}>
                    <span className={`text-xs font-semibold flex items-center gap-1 ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}>
                      <CheckCircle2 className="size-3.5 text-blue-600" /> Verified Host
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(`Sign in to proceed with booking ${prop.title}!`);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:from-blue-500 hover:to-indigo-500"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* =========================================================
          POPULAR CITIES SECTION
         ========================================================= */}
      <section id="locations" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-2">Prime Destinations</span>
          <h2 className={`text-3xl sm:text-4xl font-black ${isDark ? "text-white" : "text-slate-950"}`}>Explore Top Rental Cities</h2>
          <p className={`text-sm mt-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}>Find luxury homes, studios, and penthouses in India's most vibrant metropolitan hubs.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {POPULAR_LOCATIONS.map((loc) => (
            <motion.div
              key={loc.name}
              whileHover={{ scale: 1.03 }}
              onClick={() => handleAction(`Explore all properties in ${loc.name}!`)}
              className={`relative h-60 rounded-3xl overflow-hidden border shadow-xl cursor-pointer group ${
                isDark ? "border-slate-800" : "border-slate-200"
              }`}
            >
              <img
                src={loc.img}
                alt={loc.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors">{loc.name}</h3>
                <p className="text-xs font-medium text-slate-300 mt-1">{loc.count}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* =========================================================
          WHY CHOOSE RENTORA (AIRBNB / OYO TRUST EXPERIENCE)
         ========================================================= */}
      <section id="why-us" className={`py-20 border-t ${
        isDark ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            <div className="lg:col-span-5">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-2">Unmatched Standard</span>
              <h2 className={`text-3xl sm:text-4xl font-black leading-tight ${
                isDark ? "text-white" : "text-slate-950"
              }`}>
                Designed for Seamless Living & Rental Harmony
              </h2>
              <p className={`text-sm mt-4 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                Rentora eliminates traditional rental friction. Whether you are a tenant seeking a luxury flat or a landlord managing properties, we provide end-to-end digital automation.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { title: "Zero Brokerage Friction", desc: "Connect directly with verified owners with no middleman markup." },
                  { title: "Smart Digital Leases", desc: "Instant automated agreements signed securely online." },
                  { title: "24/7 Priority Maintenance", desc: "Raise repairs & track service tickets directly in your app dashboard." }
                ].map((item, idx) => (
                  <div key={idx} className={`flex items-start gap-4 p-4 rounded-2xl border ${
                    isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="size-8 rounded-xl bg-blue-600/20 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      <CheckCircle2 className="size-5" />
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{item.title}</h4>
                      <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Cards Showcase */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { icon: ShieldCheck, title: "100% Verified Homes", text: "Every property undergoes physical and legal audit before listing.", color: "text-emerald-600 bg-emerald-500/10" },
                { icon: Zap, title: "Instant Rent Payments", text: "Automated monthly rent dispatch with reward points and credit score boost.", color: "text-cyan-600 bg-cyan-500/10" },
                { icon: KeyRound, title: "Smart Keyless Access", text: "Integrated digital lock code distribution for modern tenants.", color: "text-indigo-600 bg-indigo-500/10" },
                { icon: PhoneCall, title: "Dedicated Support", text: "Personal rental manager assigned to assist throughout your stay.", color: "text-blue-600 bg-blue-500/10" }
              ].map((feat, idx) => (
                <div key={idx} className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                  isDark ? "bg-slate-950 border-slate-800 hover:border-slate-700" : "bg-slate-50 border-slate-200 hover:border-slate-300 shadow-sm"
                }`}>
                  <div className={`size-12 rounded-2xl ${feat.color} flex items-center justify-center mb-6`}>
                    <feat.icon className="size-6" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>{feat.title}</h3>
                    <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>{feat.text}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================
          BANNER / CALL TO ACTION
         ========================================================= */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-8 sm:p-14 text-center border border-blue-500/30 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl mx-auto">
            <span className="px-4 py-1.5 rounded-full bg-white/20 text-white font-black text-xs uppercase tracking-wider inline-block mb-4">
              Get Started Today
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Ready to Upgrade Your Living Space?
            </h2>
            <p className="text-indigo-100 text-base mt-4 max-w-xl mx-auto">
              Join thousands of happy tenants and landlords using Rentora across India. Create your account in less than 60 seconds.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="px-8 py-4 bg-white hover:bg-slate-100 text-blue-900 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-transform hover:scale-105"
              >
                Create Free Account
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 bg-blue-900/50 hover:bg-blue-900 text-white font-bold text-sm rounded-2xl border border-white/20 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER (CORRESPONDING LIGHT & DARK)
         ========================================================= */}
      <footer className={`border-t pt-16 pb-12 text-sm transition-colors ${
        isDark ? "bg-slate-950 border-slate-800 text-slate-400" : "bg-white border-slate-200 text-slate-600"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-10">

          <div className="md:col-span-4">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5">
                <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${
                  isDark ? "bg-slate-950" : "bg-white"
                }`}>
                  <Building2 className="size-5 text-blue-600" />
                </div>
              </div>
              <span className={`text-xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>RENTORA</span>
            </Link>
            <p className="text-xs leading-relaxed pr-4">
              India's premier digital rental and property management platform. Connecting verified landlords with discerning tenants.
            </p>
            <p className={`text-xs mt-6 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              © {new Date().getFullYear()} Rentora Technologies Inc. All rights reserved.
            </p>
          </div>

          <div className="md:col-span-2">
            <h4 className={`font-bold text-xs uppercase tracking-wider mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Properties</h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li><button onClick={() => handleAction()} className="hover:text-blue-600">Mumbai Rentals</button></li>
              <li><button onClick={() => handleAction()} className="hover:text-blue-600">Bangalore Studios</button></li>
              <li><button onClick={() => handleAction()} className="hover:text-blue-600">Goa Beach Villas</button></li>
              <li><button onClick={() => handleAction()} className="hover:text-blue-600">Gurgaon Penthouses</button></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className={`font-bold text-xs uppercase tracking-wider mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Company</h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li><button onClick={() => handleAction("Rentora is built with ❤️ for seamless rentals across India.")} className="hover:text-blue-600">About Us</button></li>
              <li><button onClick={() => handleAction("Interested in career opportunities? Sign up to connect.")} className="hover:text-blue-600">Careers</button></li>
              <li><button onClick={() => handleAction("Press and media inquiries: contact@rentora.app")} className="hover:text-blue-600">Press</button></li>
              <li><button onClick={() => handleAction("Privacy policy & terms of service.")} className="hover:text-blue-600">Terms & Privacy</button></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className={`font-bold text-xs uppercase tracking-wider mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Stay Connected</h4>
            <p className="text-xs mb-4">Subscribe to receive exclusive hot rental deals before anyone else.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className={`border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-600 flex-1 ${
                  isDark ? "bg-slate-900 border-slate-800 text-white placeholder-slate-500" : "bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400"
                }`}
              />
              <button
                onClick={() => handleAction("Subscribed! Sign up for an account to manage preferences.")}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Subscribe
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* =========================================================
          PROMPT / REDIRECT MODAL FOR UNAUTHENTICATED ACTIONS
         ========================================================= */}
      <AnimatePresence>
        {promptModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative ${
                isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              <button
                onClick={() => setPromptModal({ open: false, title: "", message: "" })}
                className={`absolute top-4 right-4 p-2 rounded-full ${
                  isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <X className="size-5" />
              </button>

              <div className="size-14 rounded-2xl bg-blue-600/10 text-blue-600 border border-blue-600/20 flex items-center justify-center mb-5">
                <Lock className="size-7" />
              </div>

              <h3 className="text-xl font-extrabold mb-2">{promptModal.title}</h3>
              <p className={`text-xs sm:text-sm leading-relaxed mb-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                {promptModal.message}
              </p>

              <div className="flex flex-col gap-3">
                <Link
                  to="/register"
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm text-center rounded-xl shadow-lg"
                >
                  Create Free Account
                </Link>
                <Link
                  to="/login"
                  className={`w-full py-3.5 font-bold text-sm text-center rounded-xl ${
                    isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-200" : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                  }`}
                >
                  Log In to Existing Account
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
