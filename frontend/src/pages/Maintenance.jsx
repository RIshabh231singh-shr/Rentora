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
} from "lucide-react";
import { Badge, Button, Card, CardContent, CardFooter, Input } from "../components/ui";
import api from "../utility/axiosInstance";

export default function Maintenance() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // New request modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ title: "", description: "", category: "plumbing" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Detailed view state
  const [viewRequest, setViewRequest] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get("/maintenance");
      if (response.data) {
        setRequests(response.data);
      }
    } catch (err) {
      console.error("Error fetching maintenance requests:", err);
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
      fetchRequests();
    }
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCloseCreateModal = () => {
    setIsModalOpen(false);
    setNewRequest({ title: "", description: "", category: "plumbing" });
    setSelectedFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    setSubmitError("");
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", newRequest.title);
      formData.append("description", newRequest.description);
      formData.append("category", newRequest.category);
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      await api.post("/maintenance", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setIsModalOpen(false);
      setNewRequest({ title: "", description: "", category: "plumbing" });
      setSelectedFile(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }
      fetchRequests();
    } catch (err) {
      console.error("Error creating request:", err);
      setSubmitError(err.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewRequest = (req) => {
    setViewRequest(req);
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

  const filteredRequests = requests.filter((req) => {
    const titleMatch = req.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const categoryMatch = req.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = titleMatch || categoryMatch;
    const matchesStatus = selectedStatus === "all" || req.status === selectedStatus;
    return matchesSearch && matchesStatus;
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
                className="transition-colors font-medium rounded-lg text-blue-100/80 hover:text-white text-sm leading-5 flex px-3 py-2.5 items-center gap-3 transition-colors"
              >
                <Search className="size-4" />
                <span>Find Properties</span>
              </Link>
              <Link
                to="/maintenance"
                className="shadow-sm font-semibold rounded-lg bg-[#2b7fff] text-blue-50 text-sm leading-5 flex px-3 py-2.5 items-center gap-3"
              >
                <Wrench className="size-4" />
                <span>Maintenance Requests</span>
              </Link>
              <Link
                to="/amenities"
                className="transition-colors font-medium rounded-lg text-blue-100/80 hover:text-white text-sm leading-5 flex px-3 py-2.5 items-center gap-3"
              >
                <Calendar className="size-4" />
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
                Maintenance Requests
              </h1>
              <p className="text-[#71717b] text-sm leading-5">
                Track and manage your maintenance issues in real-time
              </p>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#2b7fff] hover:bg-[#1a66d9] text-blue-50 gap-2 cursor-pointer border-none"
            >
              <Plus className="size-4" />
              <span>New Request</span>
            </Button>
          </div>

          <div className="flex justify-between items-center gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="top-1/2 size-4 -translate-y-1/2 text-[#71717b] absolute left-3 pointer-events-none" />
              <Input
                className="bg-white pl-9"
                placeholder="Search requests…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="none"
                className={`rounded-full px-4 cursor-pointer transition-colors border border-solid ${selectedStatus === "all" ? "bg-[#2b7fff] text-white border-transparent hover:bg-[#1a66d9]" : "bg-white text-zinc-950 border-zinc-200 hover:bg-zinc-100"}`}
                onClick={() => setSelectedStatus("all")}
              >
                All
              </Button>
              <Button
                variant="none"
                className={`rounded-full px-4 cursor-pointer transition-colors border border-solid ${selectedStatus === "pending" ? "bg-[#2b7fff] text-white border-transparent hover:bg-[#1a66d9]" : "bg-white text-zinc-950 border-zinc-200 hover:bg-zinc-100"}`}
                onClick={() => setSelectedStatus("pending")}
              >
                Pending
              </Button>
              <Button
                variant="none"
                className={`rounded-full px-4 cursor-pointer transition-colors border border-solid ${selectedStatus === "in_progress" ? "bg-[#2b7fff] text-white border-transparent hover:bg-[#1a66d9]" : "bg-white text-zinc-950 border-zinc-200 hover:bg-zinc-100"}`}
                onClick={() => setSelectedStatus("in_progress")}
              >
                In Progress
              </Button>
              <Button
                variant="none"
                className={`rounded-full px-4 cursor-pointer transition-colors border border-solid ${selectedStatus === "resolved" ? "bg-[#2b7fff] text-white border-transparent hover:bg-[#1a66d9]" : "bg-white text-zinc-950 border-zinc-200 hover:bg-zinc-100"}`}
                onClick={() => setSelectedStatus("resolved")}
              >
                Completed
              </Button>
            </div>
          </div>

          <Card className="shadow-md p-0 gap-0 overflow-hidden border border-zinc-200 border-solid bg-white">
            <CardContent className="p-0">
              <table className="text-sm leading-5 w-full border-collapse">
                <thead>
                  <tr className="font-semibold text-left uppercase bg-slate-100 text-[#71717b] text-xs leading-4 tracking-wide border-b border-zinc-200 border-solid">
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Issue Title</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Date Submitted</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Last Updated</th>
                    <th className="text-right px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-[#71717b]">
                        Loading requests...
                      </td>
                    </tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-[#71717b]">
                        No maintenance requests found.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req, idx) => (
                      <tr
                        key={req._id}
                        className={idx % 2 === 1 ? "bg-slate-50 border-b border-zinc-200 border-solid" : "border-b border-zinc-200 border-solid"}
                      >
                        <td className="text-[#71717b] px-6 py-4">{idx + 1}</td>
                        <td className="font-medium text-zinc-950 px-6 py-4">
                          {req.title}
                        </td>
                        <td className="text-[#71717b] px-6 py-4 capitalize">{req.category}</td>
                        <td className="text-[#71717b] px-6 py-4">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {req.status === "pending" && (
                            <Badge className="border-transparent bg-red-100 text-red-700 font-medium">
                              Pending
                            </Badge>
                          )}
                          {req.status === "in_progress" && (
                            <Badge className="border-transparent bg-amber-100 text-amber-700 font-medium">
                              In Progress
                            </Badge>
                          )}
                          {(req.status === "resolved" || req.status === "completed") && (
                            <Badge className="border-transparent bg-emerald-100 text-emerald-700 font-medium">
                              Completed
                            </Badge>
                          )}
                          {req.status !== "pending" && req.status !== "in_progress" && req.status !== "resolved" && req.status !== "completed" && (
                            <Badge className="border-transparent bg-zinc-100 text-zinc-700 font-medium capitalize">
                              {req.status}
                            </Badge>
                          )}
                        </td>
                        <td className="text-[#71717b] px-6 py-4">
                          {new Date(req.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="text-right px-6 py-4">
                          <Button
                            className="text-[#2b7fff] border-zinc-200 border border-solid gap-1.5 bg-white hover:bg-zinc-50 border-none cursor-pointer"
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewRequest(req)}
                          >
                            <Eye className="size-3.5" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
            <CardFooter className="border-t border-zinc-200 border-solid flex px-6 py-4 justify-between items-center bg-white">
              <span className="text-[#71717b] text-xs leading-4">
                Showing {filteredRequests.length} of {requests.length} requests
              </span>
              <div className="flex items-center gap-1">
                <Button className="gap-1 border border-solid border-zinc-200 cursor-pointer" size="sm" variant="outline">
                  <ChevronLeft className="size-4" />
                  Prev
                </Button>
                <Button
                  className="size-8 bg-[#2b7fff] text-blue-50 p-0 hover:bg-[#1a66d9] cursor-pointer border-none"
                  size="sm"
                >
                  1
                </Button>
                <Button className="size-8 p-0 border border-solid border-zinc-200 cursor-pointer" size="sm" variant="outline">
                  2
                </Button>
                <Button className="gap-1 border border-solid border-zinc-200 cursor-pointer" size="sm" variant="outline">
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>

          <div className="rounded-xl bg-[#2b7fff]/5 border-[#2b7fff]/50 border border-dashed flex p-6 items-center gap-4">
            <div className="size-12 shrink-0 rounded-full bg-[#2b7fff]/10 flex justify-center items-center">
              <Wrench className="size-6 text-[#2b7fff]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-blue-900 text-sm leading-5">
                Have a new issue?
              </span>
              <span className="text-[#71717b] text-sm leading-5">
                Click + New Request to submit and track it in real-time.
              </span>
            </div>
          </div>
        </main>
      </div>

      {/* New Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl flex flex-col gap-4 border border-zinc-200 border-solid animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                <Wrench className="size-5 text-[#2b7fff]" />
                New Maintenance Request
              </h2>
              <button
                onClick={handleCloseCreateModal}
                className="text-zinc-400 hover:text-zinc-600 border-none bg-transparent cursor-pointer text-2xl font-bold"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateRequest} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-700">Issue Title</label>
                <Input
                  required
                  minLength={5}
                  maxLength={100}
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  placeholder="e.g. AC not cooling"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-700">Category</label>
                <select
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={newRequest.category}
                  onChange={(e) => setNewRequest({ ...newRequest, category: e.target.value })}
                >
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="others">Others</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-zinc-700">Description</label>
                <textarea
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={4}
                  className="w-full p-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-sans text-sm"
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  placeholder="Please detail the issue..."
                />
              </div>
              
              {/* Image Upload Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-zinc-700">Attach Photo (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#2b7fff] hover:file:bg-blue-100 cursor-pointer"
                />
                {imagePreview && (
                  <div className="mt-2 relative w-32 h-32 rounded-xl overflow-hidden border border-zinc-200 border-solid bg-slate-50">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        URL.revokeObjectURL(imagePreview);
                        setImagePreview(null);
                      }}
                      className="absolute top-1 right-1 size-6 rounded-full bg-red-500 text-white flex items-center justify-center border-none font-bold text-xs cursor-pointer shadow-md hover:bg-red-600"
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>

              {submitError && <p className="text-red-600 text-xs">{submitError}</p>}
              
              <div className="flex justify-end gap-2 mt-2">
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
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Request Details Modal */}
      {isViewModalOpen && viewRequest && (
        <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl flex flex-col gap-4 border border-zinc-200 border-solid animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                <Wrench className="size-5 text-[#2b7fff]" />
                Request Details
              </h2>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewRequest(null);
                }}
                className="text-zinc-400 hover:text-zinc-600 border-none bg-transparent cursor-pointer text-2xl font-bold"
              >
                &times;
              </button>
            </div>
            
            <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="flex justify-between items-center gap-4">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 uppercase tracking-wide">
                  {viewRequest.category}
                </span>
                <span className={`font-semibold rounded-full text-xs leading-4 px-2.5 py-1 ${
                  viewRequest.status === "pending" ? "bg-red-100 text-red-700" :
                  viewRequest.status === "in_progress" ? "bg-amber-100 text-amber-700" :
                  (viewRequest.status === "resolved" || viewRequest.status === "completed") ? "bg-emerald-100 text-emerald-700" :
                  "bg-zinc-100 text-zinc-700"
                }`}>
                  {viewRequest.status === "in_progress" ? "In Progress" : 
                   (viewRequest.status === "resolved" || viewRequest.status === "completed") ? "Completed" : 
                   viewRequest.status.charAt(0).toUpperCase() + viewRequest.status.slice(1)}
                </span>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-zinc-950">{viewRequest.title}</h3>
                <p className="text-xs text-[#71717b] mt-1">
                  Submitted on {new Date(viewRequest.createdAt).toLocaleString()}
                </p>
                {viewRequest.property && (
                  <p className="text-xs text-[#71717b] mt-0.5">
                    Property: <span className="font-semibold text-zinc-700">{viewRequest.property.propertyName || "Assigned Property"}</span>
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-zinc-700">Description</span>
                <p className="text-sm text-zinc-600 bg-slate-50 p-3 rounded-lg border border-solid border-zinc-100 whitespace-pre-wrap">
                  {viewRequest.description}
                </p>
              </div>

              {viewRequest.images && viewRequest.images.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-zinc-700">Attachment</span>
                  <div className="rounded-lg overflow-hidden border border-zinc-200 border-solid max-h-64 flex justify-center bg-slate-50 p-2">
                    <img
                      src={viewRequest.images[0]}
                      alt="Attachment Preview"
                      className="max-w-full max-h-64 object-contain rounded-lg"
                    />
                  </div>
                </div>
              )}

              {viewRequest.status === "resolved" && (
                <div className="flex flex-col gap-1 border-t border-zinc-100 pt-3">
                  <span className="text-sm font-semibold text-zinc-700">Resolution Notes</span>
                  {viewRequest.resolutionNotes ? (
                    <p className="text-sm text-green-700 bg-green-50/50 p-3 rounded-lg border border-solid border-green-100">
                      {viewRequest.resolutionNotes}
                    </p>
                  ) : (
                    <p className="text-sm text-green-600 italic">No notes provided by staff.</p>
                  )}
                  {viewRequest.resolvedAt && (
                    <span className="text-xs text-[#71717b]">
                      Resolved at: {new Date(viewRequest.resolvedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3 mt-2">
              <Button
                type="button"
                className="bg-[#2b7fff] hover:bg-[#1a66d9] text-blue-50 cursor-pointer border-none"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewRequest(null);
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
