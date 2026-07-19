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
  MapPin,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "../components/ui";
import api from "../utility/axiosInstance";
import { io } from "socket.io-client";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const [stats, setStats] = useState({
    activeRequests: 0,
    completedRequests: 0,
    upcomingBookings: 0,
    currentBooking: "None"
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [upcomingBookingsList, setUpcomingBookingsList] = useState([]);
  const [rentedProperties, setRentedProperties] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [pendingLeases, setPendingLeases] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  // Landlord action handlers
  const handleApproveBooking = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/approve`);
      const response = await api.get("/dashboard");
      if (response.data) {
        setPendingBookings(response.data.pendingBookings || []);
        setNotifications(response.data.notifications || []);
      }
    } catch (err) {
      console.error("Error approving booking:", err);
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/reject`);
      const response = await api.get("/dashboard");
      if (response.data) {
        setPendingBookings(response.data.pendingBookings || []);
        setNotifications(response.data.notifications || []);
      }
    } catch (err) {
      console.error("Error rejecting booking:", err);
    }
  };

  const handleApproveLease = async (propertyId, tenantId) => {
    try {
      await api.post(`/properties/${propertyId}/tenants/${tenantId}/accept`);
      const response = await api.get("/dashboard");
      if (response.data) {
        setPendingLeases(response.data.pendingLeases || []);
        setNotifications(response.data.notifications || []);
      }
    } catch (err) {
      console.error("Error approving lease:", err);
    }
  };

  const handleRejectLease = async (propertyId, tenantId) => {
    try {
      await api.post(`/properties/${propertyId}/tenants/${tenantId}/reject`);
      const response = await api.get("/dashboard");
      if (response.data) {
        setPendingLeases(response.data.pendingLeases || []);
        setNotifications(response.data.notifications || []);
      }
    } catch (err) {
      console.error("Error rejecting lease:", err);
    }
  };

  // Maintenance request state from dashboard bookings list

  // Maintenance request state from dashboard bookings list
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [targetPropertyId, setTargetPropertyId] = useState("");
  const [maintenanceTitle, setMaintenanceTitle] = useState("");
  const [maintenanceDescription, setMaintenanceDescription] = useState("");
  const [maintenanceCategory, setMaintenanceCategory] = useState("plumbing");
  const [maintenanceSubmitting, setMaintenanceSubmitting] = useState(false);
  const [maintenanceError, setMaintenanceError] = useState("");
  const [maintenanceSuccess, setMaintenanceSuccess] = useState("");

  const handleOpenMaintenanceModal = (propertyId) => {
    setTargetPropertyId(propertyId);
    setMaintenanceTitle("");
    setMaintenanceDescription("");
    setMaintenanceCategory("plumbing");
    setMaintenanceError("");
    setMaintenanceSuccess("");
    setIsMaintenanceModalOpen(true);
  };

  const handleSubmitMaintenanceRequest = async (e) => {
    e.preventDefault();
    setMaintenanceError("");
    setMaintenanceSuccess("");
    setMaintenanceSubmitting(true);

    try {
      const response = await api.post("/maintenance", {
        title: maintenanceTitle,
        description: maintenanceDescription,
        category: maintenanceCategory,
        propertyId: targetPropertyId
      });

      if (response.data) {
        setMaintenanceSuccess("Maintenance request submitted successfully!");
        setTimeout(() => {
          setIsMaintenanceModalOpen(false);
        }, 1500);
        
        // Refresh dashboard data
        const refreshResponse = await api.get("/dashboard");
        if (refreshResponse.data) {
          setRecentRequests(refreshResponse.data.recentRequests || []);
        }
      }
    } catch (err) {
      console.error("Error submitting maintenance request:", err);
      setMaintenanceError(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setMaintenanceSubmitting(false);
    }
  };

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
            currentBooking: "None",
            amenityBookings: 0
          });
          setRecentRequests(response.data.recentRequests || []);
          setUpcomingBookingsList(response.data.upcomingBookingsList || []);
          setRentedProperties(response.data.rentedProperties || []);
          setPendingBookings(response.data.pendingBookings || []);
          setPendingLeases(response.data.pendingLeases || []);
          setNotifications(response.data.notifications || []);
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

  useEffect(() => {
    if (!user) return;

    const socket = io("http://localhost:5000");
    socket.emit("register", user.id);

    socket.on("notification", (data) => {
      console.log("WebSocket Notification received:", data);
      const newToast = {
        id: Date.now(),
        title: data.title || "Booking Alert",
        message: data.message || "A new request has been submitted."
      };
      setToasts((prev) => [...prev, newToast]);
      
      // Also append to local notifications state
      setNotifications((prev) => [
        {
          _id: String(Date.now()),
          title: newToast.title,
          message: newToast.message,
          status: "unread",
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 6000);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const toggleNotifications = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setNotifications((prev) => prev.map(n => ({ ...n, status: "read" })));
      try {
        await api.put("/dashboard/notifications/mark-read");
      } catch (err) {
        console.error("Failed to mark notifications read:", err);
      }
    }
  };

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
    <div className="bg-white text-zinc-950 w-full h-screen flex overflow-hidden font-sans">
      <div className="flex w-full h-screen">
        
        {/* Sidebar */}
        <aside className="shrink-0 bg-blue-900 text-white flex p-6 flex-col justify-between w-60 h-screen">
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
        <main className="overflow-y-auto bg-[#F0F4FF] flex p-8 flex-col flex-1 gap-6 h-screen">
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <h1 className="font-bold text-blue-900 text-2xl leading-8">
                Good Morning, {user?.firstname || "User"} 👋
              </h1>
              <p className="text-[#71717b] text-sm leading-5">
                Here's what's happening with your property today
              </p>
            </div>
            <div className="flex items-center gap-4 relative">
              <button 
                onClick={toggleNotifications}
                className="relative size-10 shadow-sm rounded-full bg-white border-zinc-200 border-1 border-solid flex justify-center items-center cursor-pointer hover:bg-zinc-50"
              >
                <Bell className="size-5 text-blue-900" />
                {notifications.some(n => n.status === "unread") && (
                  <span className="size-2.5 rounded-full bg-red-600 absolute right-2.5 top-2 animate-pulse" />
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {showNotifications && (
                <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-2xl border border-zinc-200 border-solid py-4 w-72 md:w-80 max-h-[350px] overflow-y-auto z-[999] flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 border-b border-zinc-100 pb-2 flex justify-between items-center">
                    <span className="font-bold text-xs text-blue-900">Notifications</span>
                    <button 
                      onClick={() => setNotifications([])}
                      className="text-[10px] text-zinc-400 hover:text-zinc-600 cursor-pointer border-none bg-transparent"
                    >
                      Clear All
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-[#71717b] p-6 text-center">No notifications found</p>
                  ) : (
                    <div className="flex flex-col gap-0.5 px-2">
                      {notifications.map((notif) => {
                        const bookingId = notif.relatedBooking?._id || notif.relatedBooking;
                        const isStillPending = notif.relatedBooking?.status === "pending";
                        return (
                          <div
                            key={notif._id}
                            className={`p-2.5 rounded-xl flex flex-col gap-1 transition-colors ${notif.status === "unread" ? "bg-blue-50/70" : "hover:bg-slate-50"}`}
                          >
                            <span className="font-bold text-[11px] text-blue-950 flex items-center gap-1.5">
                              <span className="size-1.5 rounded-full bg-[#2b7fff]" />
                              {notif.title}
                            </span>
                            <p className="text-zinc-600 text-[10px] leading-relaxed pl-3">
                              {notif.message}
                            </p>
                            {notif.type === "BOOKING_CREATED" && bookingId && isStillPending && (
                              <div className="flex gap-1.5 pl-3 mt-1">
                                <button
                                  onClick={() => handleRejectBooking(bookingId)}
                                  className="bg-red-50 text-red-600 hover:bg-red-100 text-[10px] font-semibold py-1 px-3 rounded-lg border border-red-200 border-solid cursor-pointer transition-colors"
                                >
                                  Decline
                                </button>
                                <button
                                  onClick={() => handleApproveBooking(bookingId)}
                                  className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-semibold py-1 px-3 rounded-lg border-none cursor-pointer transition-colors"
                                >
                                  Confirm ✓
                                </button>
                              </div>
                            )}
                            {notif.type === "BOOKING_CREATED" && bookingId && !isStillPending && (
                              <span className="pl-3 text-[9px] text-zinc-400 italic">Already actioned</span>
                            )}
                            <span className="text-[8px] text-zinc-400 pl-3 mt-0.5">
                              {new Date(notif.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="size-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-900 font-semibold text-lg shadow-sm">
                {user?.firstname?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

            <Card className="border-l-violet-500 shadow-sm border-black/5 border-t-0 border-r-0 border-b-0 border-l-4 border-solid p-4 gap-2">
              <CardContent className="flex p-0 justify-between items-center gap-2">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-[#71717b] text-xs leading-4">
                    Amenity Bookings
                  </span>
                  <span className="font-bold text-blue-900 text-2xl leading-8">
                    {stats.amenityBookings ?? 0}
                  </span>
                </div>
                <div className="size-10 rounded-xl bg-violet-500/10 flex justify-center items-center">
                  <Zap className="size-5 text-violet-600" />
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

            {/* Conditional Column 2 depending on user role */}
            {user?.role === "landlord" ? (
              <Card className="shadow-sm p-6 gap-4 flex flex-col justify-between">
                <div>
                  <CardHeader className="p-0 flex-row justify-between items-center gap-0">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-[#2b7fff]" />
                      <CardTitle className="font-semibold text-blue-900 text-base leading-6">
                        Booking & Lease Requests
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex p-0 flex-col gap-3 mt-4 overflow-y-auto max-h-[290px] pr-1">
                    
                    {/* Lease Requests (Monthly Properties) */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Monthly Lease Requests</span>
                      {pendingLeases.length === 0 ? (
                        <p className="text-xs text-[#71717b] p-2 bg-slate-50 rounded-lg text-center">No pending lease requests</p>
                      ) : (
                        pendingLeases.map((prop) => (
                          prop.pendingTenants?.map((t) => (
                            <div key={`${prop._id}-${t._id}`} className="rounded-lg border-zinc-200 border border-solid flex p-3 justify-between items-center bg-white shadow-sm gap-2">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-zinc-950 text-xs">
                                  {t.firstname} {t.lastname}
                                </span>
                                <span className="text-[#71717b] text-[9px] leading-3">
                                  wants to rent <strong className="text-blue-900">{prop.propertyName}</strong>
                                </span>
                                <span className="text-[#71717b] text-[8px] leading-3 block">
                                  {t.email}
                                </span>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Button
                                  onClick={() => handleRejectLease(prop._id, t._id)}
                                  className="bg-red-50 text-red-600 hover:bg-red-100 text-[9px] font-semibold py-1 px-2.5 rounded-lg border-none cursor-pointer"
                                >
                                  Decline
                                </Button>
                                <Button
                                  onClick={() => handleApproveLease(prop._id, t._id)}
                                  className="bg-green-600 hover:bg-green-700 text-white text-[9px] font-semibold py-1 px-2.5 rounded-lg border-none cursor-pointer"
                                >
                                  Approve
                                </Button>
                              </div>
                            </div>
                          ))
                        ))
                      )}
                    </div>

                    {/* Booking Requests (Hourly/Amenity Bookings) */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Hourly Booking Requests</span>
                      {pendingBookings.length === 0 ? (
                        <p className="text-xs text-[#71717b] p-2 bg-slate-50 rounded-lg text-center">No pending hourly requests</p>
                      ) : (
                        pendingBookings.map((booking) => {
                          const start = new Date(booking.bookingStartTime);
                          const end = new Date(booking.bookingEndTime);
                          const formattedDate = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                          const startStr = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
                          const endStr = end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
                          
                          const isAmenity = !!booking.amenity;
                          const title = isAmenity ? booking.amenity.name : booking.property?.propertyName || "Property Slot";

                          return (
                            <div key={booking._id} className="rounded-lg border-zinc-200 border border-solid flex p-3 justify-between items-center bg-white shadow-sm gap-2">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-zinc-950 text-xs">
                                  {booking.user?.firstname} {booking.user?.lastname}
                                </span>
                                <span className="text-[#71717b] text-[9px] leading-3">
                                  wants {title} ({formattedDate}, {startStr} – {endStr})
                                </span>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Button
                                  onClick={() => handleRejectBooking(booking._id)}
                                  className="bg-red-50 text-red-600 hover:bg-red-100 text-[9px] font-semibold py-1 px-2.5 rounded-lg border-none cursor-pointer"
                                >
                                  Decline
                                </Button>
                                <Button
                                  onClick={() => handleApproveBooking(booking._id)}
                                  className="bg-green-600 hover:bg-green-700 text-white text-[9px] font-semibold py-1 px-2.5 rounded-lg border-none cursor-pointer"
                                >
                                  Confirm
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                  </CardContent>
                </div>
              </Card>
            ) : (
              <Card className="shadow-sm p-6 gap-4 flex flex-col justify-between">
                <div>
                  <CardHeader className="p-0 flex-row justify-between items-center gap-0">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-[#2b7fff]" />
                      <CardTitle className="font-semibold text-blue-900 text-base leading-6">
                        My Bookings & Rentals
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex p-0 flex-col gap-3 mt-4 overflow-y-auto max-h-[290px] pr-1">
                    
                    {/* Monthly Leases */}
                    {rentedProperties.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Active Monthly Leases</span>
                        {rentedProperties.map((prop) => (
                          <div key={prop._id} className="rounded-lg border-zinc-200 border border-solid flex p-3 justify-between items-center bg-white shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="size-9 rounded-lg bg-[#2b7fff]/10 flex justify-center items-center">
                                <Building2 className="size-4 text-[#2b7fff]" />
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-zinc-950 text-xs">
                                  {prop.propertyName}
                                </span>
                                <span className="text-[#71717b] text-[10px] flex items-center gap-1">
                                  <MapPin className="size-2.5" /> {prop.city || "Address Listed"}
                                </span>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleOpenMaintenanceModal(prop._id)}
                              className="bg-[#2b7fff] hover:bg-[#1a66d9] text-white text-[10px] font-semibold py-1.5 px-3 rounded-lg border-none cursor-pointer"
                            >
                              Raise Request
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Hourly & Amenity Bookings */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Hourly Rentals & Amenities</span>
                      {loading ? (
                        <p className="text-xs text-[#71717b] p-3 text-center">Loading bookings...</p>
                      ) : upcomingBookingsList.length === 0 && rentedProperties.length === 0 ? (
                        <p className="text-xs text-[#71717b] p-3 text-center">No active bookings found</p>
                      ) : upcomingBookingsList.length === 0 ? (
                        <p className="text-xs text-[#71717b] p-3 text-center">No hourly bookings found</p>
                      ) : (
                        upcomingBookingsList.map((booking) => {
                          const start = new Date(booking.bookingStartTime);
                          const end = new Date(booking.bookingEndTime);
                          const formattedDate = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                          const startStr = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
                          const endStr = end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
                          
                          const isAmenity = !!booking.amenity;
                          const title = isAmenity ? booking.amenity.name : booking.property?.propertyName || "Property Rental";
                          const subTitle = isAmenity 
                            ? `Amenity booking at ${booking.property?.propertyName || "Property"}`
                            : `Hourly property rental at ${booking.property?.propertyAddress || "Address"}`;

                          const statusBadgeClass = booking.status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700";

                          return (
                            <div key={booking._id} className="rounded-lg border-zinc-200 border border-solid flex p-3 justify-between items-center bg-white shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="size-9 rounded-lg bg-[#2b7fff]/10 flex justify-center items-center">
                                  {isAmenity ? <Zap className="size-4 text-[#2b7fff]" /> : <Building2 className="size-4 text-[#2b7fff]" />}
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-bold text-zinc-950 text-xs">
                                    {title}
                                  </span>
                                  <span className="text-[#71717b] text-[9px] leading-3 block max-w-[150px] truncate">
                                    {subTitle}
                                  </span>
                                  <span className="text-[#71717b] text-[9px] font-semibold leading-3 block">
                                    {formattedDate}, {startStr} – {endStr}
                                  </span>
                                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 self-start capitalize ${statusBadgeClass}`}>
                                    {booking.status}
                                  </span>
                                </div>
                              </div>
                              {booking.status === "booked" && booking.property?._id && (
                                <Button
                                  onClick={() => handleOpenMaintenanceModal(booking.property._id)}
                                  className="bg-[#2b7fff] hover:bg-[#1a66d9] text-white text-[10px] font-semibold py-1.5 px-3 rounded-lg border-none cursor-pointer animate-in fade-in"
                                >
                                  Raise Request
                                </Button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            )}
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
      {/* Real-time Toast Notifications */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-blue-900 text-white p-4 rounded-xl shadow-2xl flex flex-col gap-1 border border-blue-800 animate-in slide-in-from-right duration-200"
          >
            <div className="flex justify-between items-start">
              <span className="font-bold text-sm flex items-center gap-1.5 capitalize">
                <Bell className="size-4 text-[#2b7fff]" />
                {toast.title}
              </span>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-white/60 hover:text-white border-none bg-transparent cursor-pointer font-bold text-xs"
              >
                &times;
              </button>
            </div>
            <p className="text-xs text-blue-100/90 leading-4">{toast.message}</p>
          </div>
        ))}
      </div>
      {/* Raise Maintenance Request Modal */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl flex flex-col gap-4 border border-zinc-200 border-solid animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                <Wrench className="size-5 text-[#2b7fff]" />
                Raise Maintenance Request
              </h2>
              <button
                onClick={() => setIsMaintenanceModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 border-none bg-transparent cursor-pointer text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitMaintenanceRequest} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-700">Request Title</label>
                <Input
                  required
                  value={maintenanceTitle}
                  onChange={(e) => setMaintenanceTitle(e.target.value)}
                  placeholder="e.g. Living Room Fan Sparks"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-700">Problem Category</label>
                <select
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  value={maintenanceCategory}
                  onChange={(e) => setMaintenanceCategory(e.target.value)}
                >
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="others">Others</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-700">Describe the Issue</label>
                <textarea
                  required
                  rows={3}
                  className="w-full p-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-sans text-sm"
                  value={maintenanceDescription}
                  onChange={(e) => setMaintenanceDescription(e.target.value)}
                  placeholder="Include details about exactly what is broken..."
                />
              </div>

              {maintenanceError && <p className="text-red-600 text-xs">{maintenanceError}</p>}
              {maintenanceSuccess && <p className="text-green-600 text-xs font-semibold">{maintenanceSuccess}</p>}

              <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border border-solid border-zinc-200 cursor-pointer text-zinc-700"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={maintenanceSubmitting}
                  className="bg-[#2b7fff] hover:bg-[#1a66d9] text-blue-50 cursor-pointer border-none gap-2"
                >
                  <Send className="size-4" />
                  <span>{maintenanceSubmitting ? "Submitting..." : "Submit Request"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
