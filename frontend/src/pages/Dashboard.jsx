import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Wrench,
  Zap,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui";
import api from "../utility/axiosInstance";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeRequests: 0,
    completedRequests: 0,
    upcomingBookings: 0,
    currentBooking: "None"
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [upcomingBookingsList, setUpcomingBookingsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get("/dashboard");
        if (response.data) {
          setStats(response.data.stats || {
            activeRequests: 0,
            completedRequests: 0,
            upcomingBookings: 0,
            currentBooking: "None"
          });
          setRecentRequests(response.data.recentRequests || []);
          setUpcomingBookingsList(response.data.upcomingBookingsList || []);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

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

  return (
    <div className="bg-white text-zinc-950 w-full min-h-screen flex overflow-visible font-sans">
      <div className="flex w-full min-h-screen">
        
        {/* Sidebar */}
        <aside className="shrink-0 bg-blue-900 text-white flex p-6 flex-col justify-between w-60 min-h-screen">
          <div className="flex flex-col gap-8">
            <div className="flex px-2 items-center gap-2">
              <div className="size-9 rounded-xl bg-[#2b7fff] flex justify-center items-center">
                <Building2 className="size-5 text-white" />
              </div>
              <span className="font-bold text-xl leading-7 tracking-tight">
                Rentora
              </span>
            </div>
            <nav className="flex flex-col gap-1">
              <Link
                to="/"
                className="font-semibold rounded-full bg-blue-500 text-white text-sm leading-5 flex px-4 py-2.5 items-center gap-2"
              >
                <LayoutDashboard className="size-4" />
                Dashboard
              </Link>
              {(user?.role === "landlord" || user?.role === "admin") && (
                <Link
                  to="/properties"
                  className="font-medium rounded-full text-blue-100/80 hover:text-white text-sm leading-5 flex px-4 py-2.5 items-center gap-2 transition-colors"
                >
                  <Building2 className="size-4" />
                  Properties
                </Link>
              )}
              <Link
                to="/explore"
                className="font-medium rounded-full text-blue-100/80 hover:text-white text-sm leading-5 flex px-4 py-2.5 items-center gap-2 transition-colors"
              >
                <Search className="size-4" />
                Find Properties
              </Link>
              <Link
                to="/maintenance"
                className="font-medium rounded-full text-blue-100/80 hover:text-white text-sm leading-5 flex px-4 py-2.5 items-center gap-2 transition-colors"
              >
                <Wrench className="size-4" />
                Maintenance
              </Link>
              <Link
                to="/amenities"
                className="font-medium rounded-full text-blue-100/80 hover:text-white text-sm leading-5 flex px-4 py-2.5 items-center gap-2 transition-colors"
              >
                <Zap className="size-4" />
                Amenities
              </Link>
              <Link
                to="/profile"
                className="font-medium rounded-full text-blue-100/80 hover:text-white text-sm leading-5 flex px-4 py-2.5 items-center gap-2 transition-colors"
              >
                <Settings className="size-4" />
                Profile
              </Link>
            </nav>
          </div>
          <button
            onClick={handleLogout}
            className="font-medium rounded-full text-blue-100/80 hover:text-white text-sm leading-5 flex px-4 py-2.5 items-center gap-2 cursor-pointer transition-colors border-none bg-transparent text-left w-full"
          >
            <LogOut className="size-4" />
            Logout
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="overflow-y-auto bg-[#F0F4FF] flex p-8 flex-col flex-1 gap-6 min-h-screen">
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <h1 className="font-bold text-blue-900 text-2xl leading-8">
                Good Morning, {user?.firstname || "User"} 👋
              </h1>
              <p className="text-[#71717b] text-sm leading-5">
                Here's what's happening with your property today
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative size-10 shadow-sm rounded-full bg-white border-zinc-200 border-1 border-solid flex justify-center items-center cursor-pointer">
                <Bell className="size-5 text-blue-900" />
                <span className="size-2 rounded-full bg-[#e7000b] absolute right-2 top-1.5" />
              </button>
              <div className="size-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-900 font-semibold text-lg shadow-sm">
                {user?.firstname?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-primary shadow-sm border-black/5 border-t-0 border-r-0 border-b-0 border-l-4 border-solid p-4 gap-2">
              <CardContent className="flex p-0 justify-between items-center gap-2">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-[#71717b] text-xs leading-4">
                    Active Requests
                  </span>
                  <span className="font-bold text-blue-900 text-2xl leading-8">
                    {stats.activeRequests}
                  </span>
                </div>
                <div className="size-10 rounded-xl bg-[#2b7fff]/10 flex justify-center items-center">
                  <Wrench className="size-5 text-[#2b7fff]" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-green-500 shadow-sm border-black/5 border-t-0 border-r-0 border-b-0 border-l-4 border-solid p-4 gap-2">
              <CardContent className="flex p-0 justify-between items-center gap-2">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-[#71717b] text-xs leading-4">
                    Completed Requests
                  </span>
                  <span className="font-bold text-blue-900 text-2xl leading-8">
                    {stats.completedRequests}
                  </span>
                </div>
                <div className="size-10 rounded-xl bg-green-500/10 flex justify-center items-center">
                  <CheckCircle2 className="size-5 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-[#2b7fff] shadow-sm border-black/5 border-t-0 border-r-0 border-b-0 border-l-4 border-solid p-4 gap-2">
              <CardContent className="flex p-0 justify-between items-center gap-2">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-[#71717b] text-xs leading-4">
                    Upcoming Bookings
                  </span>
                  <span className="font-bold text-blue-900 text-2xl leading-8">
                    {stats.upcomingBookings}
                  </span>
                </div>
                <div className="size-10 rounded-xl bg-[#2b7fff]/10 flex justify-center items-center">
                  <Calendar className="size-5 text-[#2b7fff]" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-amber-500 shadow-sm border-black/5 border-t-0 border-r-0 border-b-0 border-l-4 border-solid p-4 gap-2">
              <CardContent className="flex p-0 justify-between items-center gap-2">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-[#71717b] text-xs leading-4">
                    Current Booking
                  </span>
                  <span className="font-bold text-blue-900 text-sm leading-5">
                    {stats.currentBooking}
                  </span>
                </div>
                <div className="size-10 rounded-xl bg-amber-500/10 flex justify-center items-center">
                  <Clock className="size-5 text-amber-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subsections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Maintenance Requests Card */}
            <Card className="shadow-sm p-6 gap-4">
              <CardHeader className="p-0 flex-row justify-between items-center gap-0">
                <div className="flex items-center gap-2">
                  <Wrench className="size-4 text-[#2b7fff]" />
                  <CardTitle className="font-semibold text-blue-900 text-base leading-6">
                    My Maintenance Requests
                  </CardTitle>
                </div>
                <Link to="/maintenance" className="font-medium text-[#2b7fff] text-sm leading-5 hover:underline">
                  View All
                </Link>
              </CardHeader>
              <CardContent className="flex p-0 flex-col gap-2 mt-4">
                {loading ? (
                  <p className="text-sm text-[#71717b] p-3 text-center">Loading requests...</p>
                ) : recentRequests.length === 0 ? (
                  <p className="text-sm text-[#71717b] p-3 text-center">No maintenance requests found</p>
                ) : (
                  recentRequests.map((req) => (
                    <div key={req._id} className="rounded-lg border-zinc-200 border border-solid flex p-3 justify-between items-center bg-white shadow-sm">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-zinc-950 text-sm leading-5">
                          {req.title}
                        </span>
                        <span className="text-[#71717b] text-xs leading-4">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`font-medium rounded-full text-xs leading-4 px-2.5 py-1 ${
                        req.status === "pending" ? "bg-red-100 text-red-700" :
                        req.status === "in_progress" ? "bg-amber-100 text-amber-700" :
                        req.status === "resolved" ? "bg-green-100 text-green-700" :
                        "bg-zinc-100 text-zinc-700"
                      }`}>
                        {req.status === "in_progress" ? "In Progress" : req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Amenity Bookings Card */}
            <Card className="shadow-sm p-6 gap-4">
              <CardHeader className="p-0 flex-row justify-between items-center gap-0">
                <div className="flex items-center gap-2">
                  <Zap className="size-4 text-[#2b7fff]" />
                  <CardTitle className="font-semibold text-blue-900 text-base leading-6">
                    Upcoming Amenity Bookings
                  </CardTitle>
                </div>
                <Link to="/amenities" className="font-medium text-[#2b7fff] text-sm leading-5 hover:underline">
                  View All
                </Link>
              </CardHeader>
              <CardContent className="flex p-0 flex-col gap-2 mt-4">
                {loading ? (
                  <p className="text-sm text-[#71717b] p-3 text-center">Loading bookings...</p>
                ) : upcomingBookingsList.length === 0 ? (
                  <p className="text-sm text-[#71717b] p-3 text-center">No upcoming bookings found</p>
                ) : (
                  upcomingBookingsList.map((booking) => {
                    const start = new Date(booking.bookingStartTime);
                    const end = new Date(booking.bookingEndTime);
                    const formattedDate = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    const startStr = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
                    const endStr = end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
                    return (
                      <div key={booking._id} className="rounded-lg border-zinc-200 border border-solid flex p-3 items-center gap-3 bg-white shadow-sm">
                        <div className="size-9 rounded-lg bg-[#2b7fff]/10 flex justify-center items-center">
                          <Calendar className="size-4 text-[#2b7fff]" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-zinc-950 text-sm leading-5">
                            {booking.amenity?.name || "Amenity"}
                          </span>
                          <span className="text-[#71717b] text-xs leading-4">
                            {formattedDate}, {startStr} – {endStr}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Footer Notice */}
          <div className="rounded-xl bg-[#2b7fff]/10 border-[#2b7fff]/20 border border-solid flex p-4 items-center gap-3">
            <span className="relative size-3 flex">
              <span className="inline-flex size-full animate-ping opacity-75 rounded-full bg-green-400 absolute" />
              <span className="relative inline-flex size-3 rounded-full bg-green-500" />
            </span>
            <p className="font-medium text-blue-900 text-sm leading-5">
              Live updates enabled — maintenance statuses sync in real-time via Socket.IO
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
