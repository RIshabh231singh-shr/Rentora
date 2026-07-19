import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  Building,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarPlus,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  User,
  Waves,
  Wrench,
  Zap,
  Search,
} from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "../components/ui";
import api from "../utility/axiosInstance";

const TIME_SLOTS = [
  { id: "slot1", label: "8 - 10 AM", startHour: 8, endHour: 10 },
  { id: "slot2", label: "10 - 12 PM", startHour: 10, endHour: 12 },
  { id: "slot3", label: "12 - 2 PM", startHour: 12, endHour: 14 },
  { id: "slot4", label: "2 - 4 PM", startHour: 14, endHour: 16 },
  { id: "slot5", label: "4 - 6 PM", startHour: 16, endHour: 18 },
  { id: "slot6", label: "6 - 8 PM", startHour: 18, endHour: 20 },
];

export default function Amenities() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const [amenities, setAmenities] = useState([]);
  const [selectedAmenity, setSelectedAmenity] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");

  // My Bookings list modal
  const [isBookingsModalOpen, setIsBookingsModalOpen] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const fetchAmenities = async () => {
    try {
      setLoading(true);
      const response = await api.get("/amenities");
      if (response.data && response.data.length > 0) {
        setAmenities(response.data);
        setSelectedAmenity(response.data[0]);
      }
    } catch (err) {
      console.error("Error fetching amenities:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookedSlots = async (amenityId, date) => {
    try {
      const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD
      const response = await api.get(`/amenities/${amenityId}/bookings`, {
        params: { date: dateString }
      });
      if (response.data) {
        const booked = response.data.map((b) => {
          const start = new Date(b.bookingStartTime);
          const end = new Date(b.bookingEndTime);
          return {
            startHour: start.getHours(),
            endHour: end.getHours()
          };
        });
        setBookedSlots(booked);
      }
    } catch (err) {
      console.error("Error fetching booked slots:", err);
    }
  };

  const fetchMyBookings = async () => {
    try {
      setBookingsLoading(true);
      const response = await api.get("/amenities/bookings");
      if (response.data) {
        setMyBookings(response.data);
      }
    } catch (err) {
      console.error("Error fetching user bookings:", err);
    } finally {
      setBookingsLoading(false);
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
    if (user) {
      fetchAmenities();
    }
  }, [user]);

  useEffect(() => {
    if (selectedAmenity && selectedDate) {
      fetchBookedSlots(selectedAmenity._id, selectedDate);
      setSelectedSlot(null);
      setBookingSuccess("");
      setBookingError("");
    }
  }, [selectedAmenity, selectedDate]);

  const handleConfirmBooking = async () => {
    if (!selectedAmenity || !selectedSlot) return;
    setBookingError("");
    setBookingSuccess("");
    setBookingLoading(true);
    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const date = selectedDate.getDate();

      const start = new Date(year, month, date, selectedSlot.startHour, 0, 0);
      const end = new Date(year, month, date, selectedSlot.endHour, 0, 0);

      await api.post("/amenities/book", {
        amenityId: selectedAmenity._id,
        bookingStartTime: start.toISOString(),
        bookingEndTime: end.toISOString()
      });

      setBookingSuccess(`Successfully booked ${selectedAmenity.name} for ${selectedSlot.label}!`);
      setSelectedSlot(null);
      fetchBookedSlots(selectedAmenity._id, selectedDate);
    } catch (err) {
      console.error("Error booking amenity:", err);
      setBookingError(err.response?.data?.message || "Failed to book amenity");
    } finally {
      setBookingLoading(false);
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

  const handleMonthChange = (direction) => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1);
    setCurrentMonth(newMonth);
  };

  const getAmenityIcon = (name) => {
    switch (name.toLowerCase()) {
      case "gym":
        return <Dumbbell className="size-6 text-[#2b7fff]" />;
      case "swimming pool":
      case "pool":
        return <Waves className="size-6 text-cyan-500" />;
      case "community hall":
      case "hall":
        return <Building className="size-6 text-purple-500" />;
      case "parking slot":
      case "parking":
        return <Car className="size-6 text-[#71717b]" />;
      case "tennis court":
      case "tennis":
        return <Activity className="size-6 text-green-600" />;
      default:
        return <Zap className="size-6 text-yellow-500" />;
    }
  };

  const getAmenityIconContainerClass = (name) => {
    switch (name.toLowerCase()) {
      case "gym":
        return "size-12 rounded-xl bg-[#2b7fff]/10 flex justify-center items-center";
      case "swimming pool":
      case "pool":
        return "size-12 rounded-xl bg-cyan-100 flex justify-center items-center";
      case "community hall":
      case "hall":
        return "size-12 rounded-xl bg-purple-100 flex justify-center items-center";
      case "parking slot":
      case "parking":
        return "size-12 rounded-xl bg-zinc-100 flex justify-center items-center";
      case "tennis court":
      case "tennis":
        return "size-12 rounded-xl bg-green-100 flex justify-center items-center";
      default:
        return "size-12 rounded-xl bg-yellow-100 flex justify-center items-center";
    }
  };

  const isSlotBooked = (slot) => {
    return bookedSlots.some(
      (b) => slot.startHour < b.endHour && slot.endHour > b.startHour
    );
  };

  const renderCalendarDays = () => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const startDayIndex = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const daySpans = [];
    for (let i = 0; i < startDayIndex; i++) {
      daySpans.push(<span key={`empty-${i}`} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected =
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentMonth.getMonth() &&
        selectedDate.getFullYear() === currentMonth.getFullYear();

      daySpans.push(
        <button
          key={`day-${day}`}
          onClick={() => setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
          className={`h-9 w-full flex justify-center items-center rounded-md text-sm leading-5 cursor-pointer border-none transition-all ${
            isSelected
              ? "bg-[#2b7fff] text-white font-semibold shadow-sm"
              : "bg-transparent text-zinc-950 hover:bg-zinc-100"
          }`}
        >
          {day}
        </button>
      );
    }
    return daySpans;
  };

  const handleOpenBookings = () => {
    setIsBookingsModalOpen(true);
    fetchMyBookings();
  };

  return (
    <div className="bg-white text-zinc-950 flex w-full h-screen overflow-hidden font-sans">
      <aside className="shrink-0 h-screen bg-blue-900 text-white flex p-6 flex-col w-60">
        <div className="flex mb-8 px-1 items-center gap-2">
          <div className="size-9 rounded-xl bg-white/15 flex justify-center items-center">
            <Building2 className="size-5 text-white" />
          </div>
          <span className="font-bold text-white text-xl leading-7 tracking-tight">
            Rentora
          </span>
        </div>
        <nav className="flex flex-col flex-1 gap-1">
          <Link
            to="/"
            className="transition-colors rounded-lg text-white/70 hover:text-white text-sm leading-5 flex px-3 py-2.5 items-center gap-3"
          >
            <LayoutDashboard className="size-4" />
            Dashboard
          </Link>
          {(user?.role === "landlord" || user?.role === "admin") && (
            <Link
              to="/properties"
              className="transition-colors rounded-lg text-white/70 hover:text-white text-sm leading-5 flex px-3 py-2.5 items-center gap-3 transition-colors"
            >
              <Building2 className="size-4" />
              My Properties
            </Link>
          )}
          <Link
            to="/explore"
            className="transition-colors rounded-lg text-white/70 hover:text-white text-sm leading-5 flex px-3 py-2.5 items-center gap-3 transition-colors"
          >
            <Search className="size-4" />
            Find Properties
          </Link>
          <Link
            to="/maintenance"
            className="transition-colors rounded-lg text-white/70 hover:text-white text-sm leading-5 flex px-3 py-2.5 items-center gap-3"
          >
            <Wrench className="size-4" />
            Maintenance Requests
          </Link>
          <Link
            to="/amenities"
            className="font-medium rounded-lg bg-[#2b7fff] text-blue-50 text-sm leading-5 flex px-3 py-2.5 items-center gap-3"
          >
            <Zap className="size-4" />
            Amenity Booking
          </Link>
          <Link
            to="/profile"
            className="transition-colors rounded-lg text-white/70 hover:text-white text-sm leading-5 flex px-3 py-2.5 items-center gap-3"
          >
            <User className="size-4" />
            Profile
          </Link>
        </nav>
        <button
          onClick={handleLogout}
          className="transition-colors rounded-lg text-white/70 hover:text-white text-sm leading-5 flex mt-4 px-3 py-2.5 items-center gap-3 cursor-pointer border-none bg-transparent text-left w-full"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </aside>

      <main className="h-screen bg-zinc-100 p-8 flex-1 overflow-y-auto">
        <div className="flex mb-6 justify-between items-start">
          <div className="flex flex-col gap-1">
            <h1 className="font-bold text-blue-900 text-2xl leading-8">
              Amenity Booking
            </h1>
            <p className="text-[#71717b] text-sm leading-5">
              Book shared amenities and manage your reservations
            </p>
          </div>
          <Button
            onClick={handleOpenBookings}
            className="text-[#2b7fff] hover:text-[#1a66d9] border-[#2b7fff] border border-solid gap-2 bg-white cursor-pointer"
            variant="outline"
          >
            <CalendarCheck className="size-4" />
            My Bookings
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64 bg-white rounded-3xl border border-zinc-200 border-solid shadow-sm">
            <p className="text-zinc-500 font-medium">Loading amenities...</p>
          </div>
        ) : amenities.length === 0 ? (
          <div className="flex justify-center items-center h-64 bg-white rounded-3xl border border-zinc-200 border-solid shadow-sm">
            <p className="text-zinc-500 font-medium">No amenities available for booking.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto flex mb-6 pb-2 gap-4">
              {amenities.map((amenity) => {
                const isSelected = selectedAmenity?._id === amenity._id;
                return (
                  <Card
                    key={amenity._id}
                    onClick={() => setSelectedAmenity(amenity)}
                    className={`relative shrink-0 p-4 gap-2 w-44 bg-white shadow-sm cursor-pointer border border-solid transition-all hover:scale-[1.02] ${
                      isSelected ? "border-[#2b7fff] border-2" : "border-zinc-200"
                    }`}
                  >
                    {isSelected && (
                      <div className="size-5 rounded-full bg-[#2b7fff] flex absolute right-3 top-3 justify-center items-center">
                        <Check className="size-3 text-blue-50" />
                      </div>
                    )}
                    <CardContent className="flex p-0 flex-col items-center gap-2">
                      <div className={getAmenityIconContainerClass(amenity.name)}>
                        {getAmenityIcon(amenity.name)}
                      </div>
                      <span className="font-semibold text-zinc-950 text-sm leading-5 text-center">
                        {amenity.name}
                      </span>
                      <span className="font-medium text-emerald-600 text-xs leading-4 flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Available
                      </span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Calendar Card */}
              <Card className="p-0 gap-0 overflow-hidden bg-white border border-zinc-200 border-solid shadow-sm">
                <CardHeader className="bg-blue-900 flex px-6 py-4 flex-row justify-between items-center gap-1 border-none rounded-t-none">
                  <CardTitle className="font-semibold text-white text-base leading-6">
                    {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMonthChange(-1)}
                      className="size-7 rounded-md text-white/80 hover:text-white flex justify-center items-center cursor-pointer border-none bg-transparent"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <button
                      onClick={() => handleMonthChange(1)}
                      className="size-7 rounded-md text-white/80 hover:text-white flex justify-center items-center cursor-pointer border-none bg-transparent"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 gap-2">
                  <div className="grid grid-cols-7 mb-2 gap-1">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                      <span key={day} className="font-medium text-center text-[#71717b] text-xs leading-4">
                        {day}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {renderCalendarDays()}
                  </div>
                  <div className="border-t border-zinc-200 border-solid flex mt-4 pt-4 items-center gap-4">
                    <span className="text-[#71717b] text-xs leading-4 flex items-center gap-1.5">
                      <span className="size-3 rounded-sm bg-[#2b7fff]" />
                      Selected
                    </span>
                    <span className="text-[#71717b] text-xs leading-4 flex items-center gap-1.5">
                      <span className="size-3 rounded-sm bg-white border border-zinc-200 border-solid" />
                      Available
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Time Slots & Booking Confirmation */}
              <Card className="p-6 bg-white border border-zinc-200 border-solid shadow-sm flex flex-col justify-between">
                <div className="flex flex-col gap-4">
                  <CardHeader className="p-0 gap-1 flex flex-col border-none">
                    <CardTitle className="font-semibold text-zinc-950 text-base leading-6">
                      Select Time Slot
                    </CardTitle>
                    <p className="text-[#71717b] text-xs leading-4">
                      Available slots for {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </CardHeader>
                  <CardContent className="flex p-0 flex-col gap-4 mt-4">
                    <div className="grid grid-cols-2 gap-2">
                      {TIME_SLOTS.map((slot) => {
                        const booked = isSlotBooked(slot);
                        const isSelected = selectedSlot?.id === slot.id;
                        if (booked) {
                          return (
                            <button
                              key={slot.id}
                              disabled
                              className="line-through font-medium rounded-full bg-[#e7000b]/10 text-[#e7000b] text-sm leading-5 py-2.5 border-none cursor-not-allowed text-center"
                            >
                              {slot.label} (Booked)
                            </button>
                          );
                        }
                        return (
                          <button
                            key={slot.id}
                            onClick={() => setSelectedSlot(slot)}
                            className={`font-medium rounded-full text-sm leading-5 py-2.5 cursor-pointer border border-solid transition-colors ${
                              isSelected
                                ? "bg-[#2b7fff] text-white border-transparent"
                                : "text-[#2b7fff] border-[#2b7fff] hover:bg-[#2b7fff]/5 bg-transparent"
                            }`}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="rounded-xl bg-zinc-100 flex p-4 flex-col gap-3 mt-2">
                      <h3 className="font-semibold text-zinc-950 text-sm leading-5">
                        Booking Summary
                      </h3>
                      <div className="text-sm leading-5 flex justify-between items-center">
                        <span className="text-[#71717b] flex items-center gap-2">
                          <Dumbbell className="size-4" />
                          Amenity
                        </span>
                        <span className="font-medium text-zinc-950">{selectedAmenity?.name}</span>
                      </div>
                      <div className="text-sm leading-5 flex justify-between items-center">
                        <span className="text-[#71717b] flex items-center gap-2">
                          <Calendar className="size-4" />
                          Date
                        </span>
                        <span className="font-medium text-zinc-950">
                          {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      <div className="text-sm leading-5 flex justify-between items-center">
                        <span className="text-[#71717b] flex items-center gap-2">
                          <Clock className="size-4" />
                          Time
                        </span>
                        <span className="font-medium text-zinc-950">
                          {selectedSlot ? selectedSlot.label : "Select a slot"}
                        </span>
                      </div>
                      <div className="text-sm leading-5 flex justify-between items-center">
                        <span className="text-[#71717b] flex items-center gap-2">
                          <CircleCheck className="size-4" />
                          Status
                        </span>
                        <span
                          className={`font-medium ${
                            selectedSlot ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {selectedSlot ? "Available" : "Awaiting Selection"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  {bookingError && <p className="text-red-600 text-xs">{bookingError}</p>}
                  {bookingSuccess && <p className="text-emerald-600 text-xs">{bookingSuccess}</p>}
                  <Button
                    onClick={handleConfirmBooking}
                    disabled={!selectedSlot || bookingLoading}
                    className="font-semibold bg-[#2b7fff] hover:bg-[#1a66d9] text-blue-50 text-sm leading-5 py-3.5 gap-2 w-full cursor-pointer border-none"
                  >
                    <CalendarPlus className="size-4" />
                    {bookingLoading ? "Booking..." : "Confirm Booking"}
                  </Button>
                  <p className="text-[#71717b] text-xs leading-4 flex items-center gap-2 mt-1">
                    <ShieldCheck className="size-4 shrink-0 text-[#2b7fff]" />
                    Conflict prevention is active — overlapping bookings are automatically blocked.
                  </p>
                </div>
              </Card>
            </div>
          </>
        )}
      </main>

      {/* My Bookings Modal */}
      {isBookingsModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl flex flex-col gap-4 border border-zinc-200 border-solid animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                <CalendarCheck className="size-5 text-[#2b7fff]" />
                My Reservation History
              </h2>
              <button
                onClick={() => setIsBookingsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 border-none bg-transparent cursor-pointer text-2xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="overflow-y-auto max-h-96 pr-2 flex flex-col gap-2">
              {bookingsLoading ? (
                <p className="text-center py-6 text-zinc-500">Loading reservations...</p>
              ) : myBookings.length === 0 ? (
                <p className="text-center py-6 text-zinc-500">No reservations found.</p>
              ) : (
                myBookings.map((b) => {
                  const start = new Date(b.bookingStartTime);
                  const end = new Date(b.bookingEndTime);
                  const formattedDate = start.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  });
                  const startStr = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
                  const endStr = end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
                  
                  return (
                    <div key={b._id} className="rounded-xl border border-solid border-zinc-200 p-4 flex justify-between items-center bg-zinc-50">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-zinc-950 text-sm leading-5">
                          {b.amenity?.name || "Amenity"}
                        </span>
                        <span className="text-[#71717b] text-xs leading-4">
                          {formattedDate}
                        </span>
                        <span className="text-[#71717b] text-xs leading-4 font-medium flex items-center gap-1">
                          <Clock className="size-3 text-[#2b7fff]" />
                          {startStr} – {endStr}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`font-semibold text-xs leading-4 px-2 py-0.5 rounded-md ${
                          b.status === "booked" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          b.status === "completed" ? "bg-green-50 text-green-700 border border-green-200" :
                          "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                          {b.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-zinc-500 font-medium">
                          {b.paymentStatus === "paid" ? "Paid" : "Free"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex justify-end mt-2 pt-2 border-t border-zinc-100">
              <Button
                variant="outline"
                className="border-zinc-200 cursor-pointer border border-solid bg-transparent text-zinc-700 hover:bg-zinc-50"
                onClick={() => setIsBookingsModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
