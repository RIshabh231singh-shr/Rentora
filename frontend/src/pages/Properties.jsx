import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  User,
  Wrench,
  Zap,
  MapPin,
  Users,
  DollarSign,
} from "lucide-react";
import { Badge, Button, Card, CardContent, CardFooter, Input } from "../components/ui";
import api from "../utility/axiosInstance";

export default function Properties() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  // New property modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [newProperty, setNewProperty] = useState({
    propertyName: "",
    propertyType: "house",
    propertyAddress: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    description: "",
    capacity: "",
    amenities: "",
    pricePerHour: "",
    securityDeposit: "",
  });

  // Selected property for viewing details
  const [viewProperty, setViewProperty] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await api.get("/properties", {
        params: { myProperties: true },
      });
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
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      if (parsed.role !== "landlord" && parsed.role !== "admin") {
        navigate("/");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleCloseCreateModal = () => {
    setIsModalOpen(false);
    setNewProperty({
      propertyName: "",
      propertyType: "house",
      propertyAddress: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      description: "",
      capacity: "",
      amenities: "",
      pricePerHour: "",
      securityDeposit: "",
    });
    setSelectedFiles([]);
    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setImagePreviews([]);
    setSubmitError("");
  };

  const handleCreateProperty = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("propertyName", newProperty.propertyName);
      formData.append("propertyType", newProperty.propertyType);
      formData.append("propertyAddress", newProperty.propertyAddress);
      formData.append("city", newProperty.city);
      formData.append("state", newProperty.state);
      formData.append("pincode", newProperty.pincode);
      formData.append("country", newProperty.country);
      formData.append("description", newProperty.description);
      formData.append("capacity", newProperty.capacity);
      formData.append("amenities", newProperty.amenities);
      formData.append("pricePerHour", newProperty.pricePerHour);
      formData.append("securityDeposit", newProperty.securityDeposit);

      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });

      const response = await api.post("/properties", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data && response.data.success) {
        handleCloseCreateModal();
        fetchProperties();
      } else {
        setSubmitError(response.data.message || "Failed to create property");
      }
    } catch (err) {
      console.error("Error creating property:", err);
      setSubmitError(err.response?.data?.message || "Failed to submit property");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewProperty = (prop) => {
    setViewProperty(prop);
    setActiveImageIndex(0);
    setIsViewModalOpen(true);
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

  const filteredProperties = properties.filter((prop) => {
    const nameMatch = prop.propertyName?.toLowerCase().includes(searchQuery.toLowerCase());
    const cityMatch = prop.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const typeMatch = prop.propertyType?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = nameMatch || cityMatch || typeMatch;
    const matchesType = selectedType === "all" || prop.propertyType === selectedType;
    return matchesSearch && matchesType;
  });

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
                className="transition-colors font-medium rounded-lg text-blue-100/80 hover:text-white text-sm leading-5 flex px-3 py-2.5 items-center gap-3"
              >
                <LayoutDashboard className="size-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/properties"
                className="shadow-sm font-semibold rounded-lg bg-[#2b7fff] text-blue-50 text-sm leading-5 flex px-3 py-2.5 items-center gap-3"
              >
                <Building2 className="size-4" />
                <span>My Properties</span>
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
        <main className="bg-slate-50 flex p-8 flex-col flex-1 gap-6 min-h-screen overflow-y-auto">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <h1 className="font-bold text-blue-900 text-2xl leading-8">
                My Properties
              </h1>
              <p className="text-[#71717b] text-sm leading-5">
                Manage, list, and monitor your properties in real-time
              </p>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#2b7fff] hover:bg-[#1a66d9] text-blue-50 gap-2 cursor-pointer border-none"
            >
              <Plus className="size-4" />
              <span>Add Property</span>
            </Button>
          </div>

          <div className="flex justify-between items-center gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="top-1/2 size-4 -translate-y-1/2 text-[#71717b] absolute left-3 pointer-events-none" />
              <Input
                className="bg-white pl-9"
                placeholder="Search properties by name, city or type…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
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
              <Building2 className="size-12 text-blue-900/40" />
              <h3 className="font-semibold text-zinc-900 text-lg">No properties found</h3>
              <p className="text-[#71717b] text-sm max-w-sm">
                Get started by adding your first property. It will be immediately available for tenant applications.
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#2b7fff] hover:bg-[#1a66d9] text-blue-50 gap-2 border-none mt-2 cursor-pointer"
              >
                <Plus className="size-4" />
                <span>Add Property Now</span>
              </Button>
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
                          <span className="text-zinc-700 text-xs font-medium">Price: ₹{prop.pricePerHour}/hr</span>
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
                      onClick={() => handleViewProperty(prop)}
                      className="w-full text-[#2b7fff] border-zinc-200 border border-solid gap-1.5 bg-white hover:bg-zinc-50 border-none cursor-pointer text-sm font-medium"
                    >
                      <Eye className="size-4" />
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* New Property Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl flex flex-col gap-4 border border-zinc-200 border-solid animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                <Building2 className="size-5 text-[#2b7fff]" />
                Add New Property
              </h2>
              <button
                onClick={handleCloseCreateModal}
                className="text-zinc-400 hover:text-zinc-600 border-none bg-transparent cursor-pointer text-2xl font-bold"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateProperty} className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-zinc-700">Property Name</label>
                  <Input
                    required
                    minLength={3}
                    maxLength={50}
                    value={newProperty.propertyName}
                    onChange={(e) => setNewProperty({ ...newProperty, propertyName: e.target.value })}
                    placeholder="e.g. Skyline Villa"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-zinc-700">Property Type</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={newProperty.propertyType}
                    onChange={(e) => setNewProperty({ ...newProperty, propertyType: e.target.value })}
                  >
                    <option value="house">House</option>
                    <option value="villa">Villa</option>
                    <option value="gym">Gym</option>
                    <option value="swimmingpool">Swimming Pool</option>
                    <option value="commercial">Commercial</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-700">Street Address</label>
                <Input
                  required
                  value={newProperty.propertyAddress}
                  onChange={(e) => setNewProperty({ ...newProperty, propertyAddress: e.target.value })}
                  placeholder="Street details, building number..."
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-zinc-700">City</label>
                  <Input
                    required
                    value={newProperty.city}
                    onChange={(e) => setNewProperty({ ...newProperty, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-zinc-700">State</label>
                  <Input
                    required
                    value={newProperty.state}
                    onChange={(e) => setNewProperty({ ...newProperty, state: e.target.value })}
                    placeholder="State"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-zinc-700">Pincode</label>
                  <Input
                    required
                    pattern="^[1-9][0-9]{5}$"
                    title="Please enter valid 6-digit pincode"
                    value={newProperty.pincode}
                    onChange={(e) => setNewProperty({ ...newProperty, pincode: e.target.value })}
                    placeholder="6-digit PIN"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-zinc-700">Country</label>
                  <Input
                    required
                    value={newProperty.country}
                    onChange={(e) => setNewProperty({ ...newProperty, country: e.target.value })}
                    placeholder="Country"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-zinc-700">Total Capacity</label>
                  <Input
                    required
                    type="number"
                    min="1"
                    value={newProperty.capacity}
                    onChange={(e) => setNewProperty({ ...newProperty, capacity: e.target.value })}
                    placeholder="Max occupants"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-zinc-700">Price per Hour (₹)</label>
                  <Input
                    required
                    type="number"
                    min="0"
                    value={newProperty.pricePerHour}
                    onChange={(e) => setNewProperty({ ...newProperty, pricePerHour: e.target.value })}
                    placeholder="Hourly rental rate"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-zinc-700">Security Deposit (₹)</label>
                  <Input
                    required
                    type="number"
                    min="0"
                    value={newProperty.securityDeposit}
                    onChange={(e) => setNewProperty({ ...newProperty, securityDeposit: e.target.value })}
                    placeholder="Advance deposit"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-700">Amenities (comma-separated)</label>
                <Input
                  required
                  value={newProperty.amenities}
                  onChange={(e) => setNewProperty({ ...newProperty, amenities: e.target.value })}
                  placeholder="e.g. WiFi, Parking, AC, Power Backup"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-700">Description</label>
                <textarea
                  required
                  rows={3}
                  className="w-full p-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-sans text-sm"
                  value={newProperty.description}
                  onChange={(e) => setNewProperty({ ...newProperty, description: e.target.value })}
                  placeholder="Detailed explanation of rooms, facilities..."
                />
              </div>

              {/* Photo Upload */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-zinc-700">Property Photos (Optional, max 5)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#2b7fff] hover:file:bg-blue-100 cursor-pointer"
                />
                {imagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative w-24 h-16 rounded-xl overflow-hidden border border-zinc-200 border-solid bg-slate-50">
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeSelectedFile(index)}
                          className="absolute top-0.5 right-0.5 size-5 rounded-full bg-red-500 text-white flex items-center justify-center border-none font-bold text-[10px] cursor-pointer shadow-md hover:bg-red-600"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {submitError && <p className="text-red-600 text-xs">{submitError}</p>}
              
              <div className="flex justify-end gap-2 mt-2 border-t border-zinc-100 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-zinc-200 cursor-pointer border border-solid bg-transparent text-zinc-700 hover:bg-zinc-50"
                  onClick={handleCloseCreateModal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#2b7fff] hover:bg-[#1a66d9] text-blue-50 cursor-pointer border-none"
                  disabled={submitting}
                >
                  {submitting ? "Listing Property..." : "List Property"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Property Details Modal */}
      {isViewModalOpen && viewProperty && (
        <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl flex flex-col gap-4 border border-zinc-200 border-solid animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                <Building2 className="size-5 text-[#2b7fff]" />
                Property Details
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
                  <span className="text-xs text-[#71717b] block">Hourly Rate</span>
                  <span className="text-[#2b7fff] font-bold text-sm">₹{viewProperty.pricePerHour} / hour</span>
                </div>
                <div>
                  <span className="text-xs text-[#71717b] block">Security Deposit</span>
                  <span className="text-zinc-950 font-bold text-sm">₹{viewProperty.securityDeposit} (Refundable)</span>
                </div>
                <div>
                  <span className="text-xs text-[#71717b] block">Current Tenants</span>
                  <span className="text-zinc-950 font-bold text-sm">{viewProperty.tenants?.length || 0} occupies</span>
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
            </div>
            
            <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3 mt-2">
              <Button
                type="button"
                className="bg-[#2b7fff] hover:bg-[#1a66d9] text-blue-50 cursor-pointer border-none"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewProperty(null);
                }}
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
