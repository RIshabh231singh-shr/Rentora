import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Calendar,
  Eye,
  LayoutDashboard,
  LogOut,
  Search,
  User,
  Wrench,
  Zap,
  MapPin,
  Users,
  DollarSign,
  Send,
  Building,
  CheckCircle,
} from "lucide-react";
import { Badge, Button, Card, CardContent, CardFooter, Input } from "../components/ui";
import api from "../utility/axiosInstance";

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export default function FindProperties() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering and Searching States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  // Details Modal and Interactive Strip States
  const [viewProperty, setViewProperty] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Hourly Booking Calendar States
  const [bookingDate, setBookingDate] = useState(new Date());
  const [bookedIntervals, setBookedIntervals] = useState([]);
  const [startHour, setStartHour] = useState(null);
  const [endHour, setEndHour] = useState(null);

  // Form submission alerts
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await api.get("/properties");
      if (response.data && response.data.success) {
        setProperties(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching properties:", err);
    } finally {
      setLoading(false);
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
      fetchProperties();
    }
  }, [user]);

  // Fetch hourly availability for property
  const fetchAvailability = async (propertyId, date) => {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      const response = await api.get(`/bookings/property/${propertyId}/availability`, {
        params: { date: dateStr }
      });

      if (response.data && response.data.success) {
        const intervals = response.data.bookings.map(b => {
          const s = new Date(b.startTime);
          const e = new Date(b.endTime);
          return {
            startHour: s.getHours(),
            endHour: e.getHours()
          };
        });
        setBookedIntervals(intervals);
      }
    } catch (err) {
      console.error("Error fetching availability:", err);
    }
  };

  useEffect(() => {
    if (isViewModalOpen && viewProperty && viewProperty.rentType === "hourly") {
      fetchAvailability(viewProperty._id, bookingDate);
      setStartHour(null);
      setEndHour(null);
      setBookingError("");
      setBookingSuccess("");
    }
  }, [isViewModalOpen, viewProperty, bookingDate]);

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

  const handleOpenDetails = (prop) => {
    setViewProperty(prop);
    setActiveImageIndex(0);
    setBookingDate(new Date());
    setBookingError("");
    setBookingSuccess("");
    setIsViewModalOpen(true);
  };

  const handleMonthlyRequestToRent = async (propertyId) => {
    setBookingError("");
    setBookingSuccess("");
    setBookingLoading(true);

    try {
      const response = await api.post(`/properties/${propertyId}/tenants`);
      if (response.data && response.data.success) {
        setBookingSuccess("Your rental request has been sent to the owner!");
        fetchProperties();
        
        // Refresh local details view
        const updatedResponse = await api.get(`/properties`);
        if (updatedResponse.data && updatedResponse.data.success) {
          const freshProp = updatedResponse.data.data.find(p => p._id === propertyId);
          if (freshProp) {
            setViewProperty(freshProp);
          }
        }
      } else {
        setBookingError(response.data.message || "Failed to submit booking request.");
      }
    } catch (err) {
      console.error("Error requesting to rent property:", err);
      setBookingError(err.response?.data?.message || "Failed to send rental request.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleHourlyBookProperty = async () => {
    if (startHour === null || endHour === null) {
      setBookingError("Please select both a start and end hour.");
      return;
    }
    setBookingError("");
    setBookingSuccess("");
    setBookingLoading(true);

    try {
      const startTime = new Date(bookingDate);
      startTime.setHours(startHour, 0, 0, 0);

      const endTime = new Date(bookingDate);
      endTime.setHours(endHour, 0, 0, 0);

      const response = await api.post("/bookings/property/book", {
        propertyId: viewProperty._id,
        bookingStartTime: startTime.toISOString(),
        bookingEndTime: endTime.toISOString()
      });

      if (response.data && response.data.success) {
        setBookingSuccess(`Successfully booked ${viewProperty.propertyName} from ${startHour}:00 to ${endHour}:00!`);
        setStartHour(null);
        setEndHour(null);
        fetchAvailability(viewProperty._id, bookingDate);
      } else {
        setBookingError(response.data.message || "Failed to book slot.");
      }
    } catch (err) {
      console.error("Error booking hourly property:", err);
      setBookingError(err.response?.data?.message || "Failed to book hourly slot.");
    } finally {
      setBookingLoading(false);
    }
  };

  // Hour pill selection logic
  const handleHourClick = (hour) => {
    if (isHourBooked(hour)) return; // Don't allow clicking booked slots

    if (startHour === null || (startHour !== null && endHour !== null)) {
      setStartHour(hour);
      setEndHour(null);
    } else {
      if (hour > startHour) {
        setEndHour(hour);
      } else {
        setStartHour(hour);
        setEndHour(null);
      }
    }
  };

  const isHourBooked = (hour) => {
    return bookedIntervals.some(b => hour >= b.startHour && hour < b.endHour);
  };

  const isHourInRange = (hour) => {
    if (startHour === null || endHour === null) return false;
    return hour >= startHour && hour <= endHour;
  };

  const isRangeConflicting = () => {
    if (startHour === null || endHour === null) return false;
    for (let h = startHour; h < endHour; h++) {
      if (isHourBooked(h)) return true;
    }
    return false;
  };

  // Client-side filtering logic
  const filteredProperties = properties.filter((prop) => {
    const nameMatch = prop.propertyName?.toLowerCase().includes(searchQuery.toLowerCase());
    const citySearch = prop.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const stateSearch = prop.state?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = nameMatch || citySearch || stateSearch;

    const matchesType = selectedType === "all" || prop.propertyType === selectedType;

    const matchesMinPrice = !minPrice || prop.pricePerHour >= parseFloat(minPrice);
    const matchesMaxPrice = !maxPrice || prop.pricePerHour <= parseFloat(maxPrice);
    
    const matchesCity = !cityFilter || prop.city?.toLowerCase().includes(cityFilter.toLowerCase());

    return matchesSearch && matchesType && matchesMinPrice && matchesMaxPrice && matchesCity;
  });

  return (
    <div className="bg-white text-zinc-950 w-full h-screen flex overflow-hidden font-sans">
      <div className="h-screen flex w-full">
        
        {/* Sidebar */}
        <aside className="shrink-0 bg-blue-900 text-white flex p-6 flex-col justify-between w-60 h-screen">
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
                className="transition-colors font-medium rounded-lg text-blue-100/80 hover:text-white text-sm leading-5 flex px-3 py-2.5 items-center gap-3"
              >
                <LayoutDashboard className="size-4" />
                <span>Dashboard</span>
              </Link>
              {(user?.role === "landlord" || user?.role === "admin") && (
                <Link
                  to="/properties"
                  className="transition-colors font-medium rounded-lg text-blue-100/80 hover:text-white text-sm leading-5 flex px-3 py-2.5 items-center gap-3 transition-colors"
                >
                  <Building2 className="size-4" />
                  <span>My Properties</span>
                </Link>
              )}
              <Link
                to="/explore"
                className="shadow-sm font-semibold rounded-lg bg-[#2b7fff] text-blue-50 text-sm leading-5 flex px-3 py-2.5 items-center gap-3"
              >
                <Search className="size-4" />
                <span>Find Properties</span>
              </Link>
              <Link
                to="/maintenance"
                className="transition-colors font-medium rounded-lg text-blue-100/80 hover:text-white text-sm leading-5 flex px-3 py-2.5 items-center gap-3"
              >
                <Wrench className="size-4" />
                <span>Maintenance Requests</span>
              </Link>
              <Link
                to="/amenities"
                className="transition-colors font-medium rounded-lg text-blue-100/80 hover:text-white text-sm leading-5 flex px-3 py-2.5 items-center gap-3"
              >
                <Zap className="size-4" />
                <span>Amenity Booking</span>
              </Link>
              <Link
                to="/profile"
                className="transition-colors font-medium rounded-lg text-blue-100/80 hover:text-white text-sm leading-5 flex px-3 py-2.5 items-center gap-3"
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

        {/* Main Content */}
        <main className="bg-slate-50 flex p-8 flex-col flex-1 gap-6 h-screen overflow-y-auto">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <h1 className="font-bold text-blue-900 text-2xl leading-8">
                Explore Properties
              </h1>
              <p className="text-[#71717b] text-sm leading-5">
                Search, filter, and apply for properties listed in Rentora
              </p>
            </div>
          </div>

          {/* Search Filters Row */}
          <div className="bg-white border border-zinc-200 border-solid rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="top-1/2 size-4 -translate-y-1/2 text-[#71717b] absolute left-3 pointer-events-none" />
                <Input
                  className="bg-slate-50 pl-9 border-zinc-200"
                  placeholder="Search name, city, state..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <Input
                  className="bg-slate-50 border-zinc-200"
                  type="number"
                  placeholder="Min Price (₹)"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>
              <div>
                <Input
                  className="bg-slate-50 border-zinc-200"
                  type="number"
                  placeholder="Max Price (₹)"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
              <div>
                <Input
                  className="bg-slate-50 border-zinc-200"
                  placeholder="Filter by Specific City"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                />
              </div>
            </div>

            {/* Type Filters Row */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-solid border-zinc-100">
              <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mr-2">Property Types:</span>
              {["all", "house", "villa", "gym", "swimmingpool", "commercial", "other"].map((type) => (
                <Button
                  key={type}
                  variant="none"
                  className={`rounded-full px-4 cursor-pointer transition-colors border border-solid capitalize ${selectedType === type ? "bg-[#2b7fff] text-white border-transparent hover:bg-[#1a66d9]" : "bg-white text-zinc-950 border-zinc-200 hover:bg-zinc-100"}`}
                  onClick={() => setSelectedType(type)}
                >
                  {type === "swimmingpool" ? "Pool" : type}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-[#71717b]">Loading properties...</div>
          ) : filteredProperties.length === 0 ? (
            <div className="bg-white border border-zinc-200 border-solid rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <Building className="size-12 text-blue-900/40" />
              <h3 className="font-semibold text-zinc-900 text-lg">No matching properties found</h3>
              <p className="text-[#71717b] text-sm max-w-sm">
                Try widening your search filters, adjusting the price limits, or exploring other choices.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredProperties.map((prop) => (
                <Card key={prop._id} className="overflow-hidden border border-zinc-200 border-solid bg-white flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <div className="h-48 w-full bg-slate-100 overflow-hidden relative">
                      <img
                        src={prop.images?.[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80"}
                        alt={prop.propertyName}
                        className="w-full h-full object-contain bg-[#f8fafc]"
                      />
                      <Badge className="absolute top-3 right-3 bg-blue-900/80 text-white font-medium border-transparent capitalize">
                        {prop.propertyType}
                      </Badge>
                    </div>
                    <CardContent className="p-5 flex flex-col gap-3">
                      <div>
                        <h3 className="font-bold text-zinc-950 text-lg leading-6">{prop.propertyName}</h3>
                        <p className="text-[#71717b] text-xs flex items-center gap-1 mt-1">
                          <MapPin className="size-3 text-[#2b7fff]" />
                          {prop.city}, {prop.state}
                        </p>
                      </div>
                      <p className="text-zinc-600 text-sm leading-5 line-clamp-2">
                        {prop.description}
                      </p>
                      <div className="grid grid-cols-2 gap-2 border-t border-b border-zinc-100 border-solid py-3 my-1">
                        <div className="flex items-center gap-2">
                          <Users className="size-4 text-[#71717b]" />
                          <span className="text-zinc-700 text-xs font-medium">Capacity: {prop.capacity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="size-4 text-[#71717b]" />
                          <span className="text-zinc-700 text-xs font-medium">
                            Price: ₹{prop.pricePerHour}/{prop.rentType === "monthly" ? "mo" : "hr"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {prop.amenities?.map((amenity, idx) => (
                          <Badge key={idx} variant="secondary" className="text-[10px] bg-slate-100 text-slate-700 font-normal">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </div>
                  <CardFooter className="p-5 pt-0">
                    <Button
                      onClick={() => handleOpenDetails(prop)}
                      className="w-full text-[#2b7fff] border-zinc-200 border border-solid gap-1.5 bg-white hover:bg-zinc-50 border-none cursor-pointer text-sm font-medium"
                    >
                      <Eye className="size-4" />
                      View Details & Book
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* View Property Details Modal */}
      {isViewModalOpen && viewProperty && (
        <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl flex flex-col gap-4 border border-zinc-200 border-solid animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                <Building2 className="size-5 text-[#2b7fff]" />
                Property details
              </h2>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewProperty(null);
                }}
                className="text-zinc-400 hover:text-zinc-600 border-none bg-transparent cursor-pointer text-2xl font-bold"
              >
                &times;
              </button>
            </div>
            
            <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Image Scroller Gallery */}
              <div className="flex flex-col gap-2">
                <div className="h-56 w-full bg-slate-100 overflow-hidden rounded-xl border border-zinc-200 border-solid flex justify-center items-center">
                  <img
                    src={(viewProperty.images && viewProperty.images.length > 0) ? viewProperty.images[activeImageIndex] : "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80"}
                    alt={viewProperty.propertyName}
                    className="w-full h-full object-contain bg-[#f8fafc]"
                  />
                </div>
                {viewProperty.images && viewProperty.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {viewProperty.images.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`size-16 rounded-lg overflow-hidden border-2 border-solid shrink-0 p-0 cursor-pointer ${activeImageIndex === idx ? "border-[#2b7fff]" : "border-zinc-200"}`}
                      >
                        <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center gap-4">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 uppercase tracking-wide">
                  {viewProperty.propertyType}
                </span>
                <span className="text-xs text-[#71717b]">
                  Listed on {new Date(viewProperty.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-zinc-950">{viewProperty.propertyName}</h3>
                <p className="text-sm text-zinc-600 flex items-center gap-1 mt-1.5">
                  <MapPin className="size-4 text-[#2b7fff]" />
                  {viewProperty.propertyAddress}, {viewProperty.city}, {viewProperty.state} - {viewProperty.pincode}, {viewProperty.country}
                </p>
              </div>

              {/* Owner details */}
              {viewProperty.owner && (
                <div className="flex flex-col gap-1 border-t border-dashed border-zinc-200 pt-3">
                  <span className="text-xs text-[#71717b] uppercase font-bold">Property Host</span>
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-blue-100 flex justify-center items-center text-blue-700 text-xs font-bold capitalize">
                      {viewProperty.owner.firstname?.[0] || "H"}{viewProperty.owner.lastname?.[0] || ""}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-zinc-800">
                        {viewProperty.owner.firstname || "Host"} {viewProperty.owner.lastname || ""}
                      </span>
                      <span className="text-xs text-[#71717b] block">{viewProperty.owner.email}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-zinc-700">About the Property</span>
                <p className="text-sm text-zinc-600 bg-slate-50 p-3 rounded-lg border border-solid border-zinc-100 whitespace-pre-wrap">
                  {viewProperty.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b border-zinc-100 border-solid py-3.5 my-1">
                <div>
                  <span className="text-xs text-[#71717b] block">Capacity limit</span>
                  <span className="text-zinc-950 font-bold text-sm">{viewProperty.capacity} People</span>
                </div>
                <div>
                  <span className="text-xs text-[#71717b] block">Rental Rate</span>
                  <span className="text-[#2b7fff] font-bold text-sm">
                    ₹{viewProperty.pricePerHour} / {viewProperty.rentType === "monthly" ? "month" : "hour"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-[#71717b] block">Security Deposit</span>
                  <span className="text-zinc-950 font-bold text-sm">₹{viewProperty.securityDeposit} (Refundable)</span>
                </div>
                <div>
                  <span className="text-xs text-[#71717b] block">Status</span>
                  {viewProperty.rentType === "monthly" ? (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${viewProperty.tenants?.length >= viewProperty.capacity ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                      {viewProperty.tenants?.length >= viewProperty.capacity ? "Fully Occupied" : `${viewProperty.capacity - (viewProperty.tenants?.length || 0)} space(s) free`}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block bg-blue-50 text-blue-700">
                      Hourly Booking
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-zinc-700">Amenities Available</span>
                <div className="flex flex-wrap gap-1.5">
                  {viewProperty.amenities?.map((amenity, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Dynamic Hourly Calendar Selection */}
              {viewProperty.rentType === "hourly" && (
                <div className="flex flex-col gap-3 border-t border-solid border-zinc-100 pt-4 mt-2">
                  <h4 className="font-bold text-blue-900 text-sm flex items-center gap-1.5">
                    <Calendar className="size-4 text-[#2b7fff]" />
                    Hourly Booking Calendar
                  </h4>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-zinc-500">Choose Booking Date</span>
                    <input
                      type="date"
                      className="h-10 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                      value={bookingDate.toISOString().split("T")[0]}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) setBookingDate(new Date(val));
                      }}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-zinc-500 block">
                      Select Hours (Click to select start and end range. Booked intervals are red, free ranges are green)
                    </span>
                    <div className="grid grid-cols-5 gap-2">
                      {HOURS.map((hour) => {
                        const booked = isHourBooked(hour);
                        const selected = startHour !== null && (hour === startHour || hour === endHour || isHourInRange(hour));
                        
                        let pillClass = "bg-white text-zinc-900 border-zinc-200 hover:bg-zinc-50";
                        if (booked) {
                          pillClass = "bg-red-100 text-red-700 border-red-200 cursor-not-allowed";
                        } else if (selected) {
                          pillClass = isRangeConflicting() 
                            ? "bg-red-500 text-white border-red-600" 
                            : "bg-green-500 text-white border-green-600";
                        }

                        return (
                          <button
                            key={hour}
                            type="button"
                            disabled={booked}
                            onClick={() => handleHourClick(hour)}
                            className={`h-9 border border-solid rounded-lg text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors ${pillClass}`}
                          >
                            {hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`}
                          </button>
                        );
                      })}
                    </div>
                    {startHour !== null && (
                      <div className="flex justify-between items-center text-xs bg-slate-50 p-2.5 rounded-lg border border-zinc-100 mt-1">
                        <span>
                          Selected Range: <strong className="text-[#2b7fff]">{startHour}:00</strong> to{" "}
                          <strong className="text-[#2b7fff]">{endHour !== null ? `${endHour}:00` : "..."}</strong>
                        </span>
                        {endHour !== null && !isRangeConflicting() && (
                          <span className="text-green-600 font-bold flex items-center gap-1">
                            <CheckCircle className="size-3.5" /> Free & Valid
                          </span>
                        )}
                        {isRangeConflicting() && (
                          <span className="text-red-600 font-bold">Contains Booked Hours!</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Error and Success alerts inside modal */}
            {bookingError && <p className="text-red-600 text-xs mt-1">{bookingError}</p>}
            {bookingSuccess && <p className="text-green-600 text-xs font-semibold mt-1">{bookingSuccess}</p>}
            
            <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3 mt-2">
              <Button
                type="button"
                variant="outline"
                className="border border-solid border-zinc-200 cursor-pointer text-zinc-700 hover:bg-zinc-50"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewProperty(null);
                }}
              >
                Close
              </Button>

              {/* Action Buttons for Booking */}
              {(() => {
                const isOwner = user && viewProperty.owner && (
                  viewProperty.owner._id === user.id || 
                  viewProperty.owner === user.id
                );
                
                const isAlreadyTenant = viewProperty.tenants?.some(
                  id => id.toString() === user?.id
                );

                const hasPending = viewProperty.pendingTenants?.some(
                  id => id.toString() === user?.id
                );

                if (isOwner) {
                  return (
                    <Badge className="bg-zinc-100 text-zinc-600 font-semibold border-zinc-200 border px-4 py-2 hover:bg-zinc-100">
                      Your Property
                    </Badge>
                  );
                }

                if (isAlreadyTenant) {
                  return (
                    <Badge className="bg-green-50 text-green-700 font-semibold border-green-200 border px-4 py-2 hover:bg-green-50">
                      Your Current Residence
                    </Badge>
                  );
                }

                // If monthly, check pending list
                if (viewProperty.rentType === "monthly") {
                  if (hasPending) {
                    return (
                      <Button
                        disabled
                        className="bg-zinc-100 text-zinc-400 border border-zinc-200 border-solid cursor-not-allowed"
                      >
                        Request Pending Approval
                      </Button>
                    );
                  }

                  const isAtCapacity = viewProperty.tenants?.length >= viewProperty.capacity;

                  return (
                    <Button
                      onClick={() => handleMonthlyRequestToRent(viewProperty._id)}
                      disabled={bookingLoading || isAtCapacity}
                      className="bg-[#2b7fff] hover:bg-[#1a66d9] text-blue-50 border-none cursor-pointer gap-2"
                    >
                      <Send className="size-4" />
                      <span>{isAtCapacity ? "Fully Occupied" : bookingLoading ? "Sending..." : "Request to Rent"}</span>
                    </Button>
                  );
                }

                // If hourly, select calendar range
                const rangeConflicting = isRangeConflicting();
                const invalidSelection = startHour === null || endHour === null || rangeConflicting;

                return (
                  <Button
                    onClick={handleHourlyBookProperty}
                    disabled={bookingLoading || invalidSelection}
                    className="bg-[#2b7fff] hover:bg-[#1a66d9] text-blue-50 border-none cursor-pointer gap-2"
                  >
                    <Send className="size-4" />
                    <span>{bookingLoading ? "Booking..." : "Book Selected Range"}</span>
                  </Button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
