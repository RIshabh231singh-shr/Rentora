import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Building2, Pencil, Trash2, Upload, X, MapPin, Users,
  DollarSign, Clock, Image as ImageIcon, CheckCircle2, ChevronDown,
  Eye, Settings, Star,
} from "lucide-react";
import Layout from "../components/Layout";
import {
  GlassCard, GradientButton, StatusBadge, EmptyState,
  Modal, SectionHeader, Badge, Avatar, Skeleton, StatCard,
} from "../components/ui";
import api from "../utility/axiosInstance";

const PROPERTY_TYPES = ["gym", "house", "villa", "swimmingpool", "commercial", "other"];
const RENT_TYPES = ["hourly", "monthly"];

function PropertyRow({ property, onEdit, onDelete, onView }) {
  const tenantCount = property.tenants?.length || 0;
  const pendingCount = property.pendingTenants?.length || 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 group"
    >
      <div className="size-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
        {property.images?.[0] ? (
          <img src={property.images[0]} alt={property.propertyName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Building2 className="size-5 text-slate-400" /></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-slate-900">{property.propertyName}</p>
          <Badge color={property.rentType === "monthly" ? "blue" : "indigo"}>{property.rentType}</Badge>
          <span className="capitalize text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{property.propertyType}</span>
        </div>
        <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5"><MapPin className="size-3" />{property.propertyAddress}, {property.city}</p>
        <div className="flex items-center gap-4 mt-1">
          <span className="text-xs text-slate-500 flex items-center gap-1"><Users className="size-3" />{tenantCount}/{property.capacity}</span>
          {pendingCount > 0 && <Badge color="amber">{pendingCount} pending</Badge>}
          <span className="text-xs font-semibold text-blue-600">₹{property.pricePerHour?.toLocaleString()}/{property.rentType === "monthly" ? "mo" : "hr"}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => onView(property)} className="size-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 cursor-pointer border-none transition-colors" title="View">
          <Eye className="size-4" />
        </button>
        <button onClick={() => onEdit(property)} className="size-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer border-none transition-colors" title="Edit">
          <Pencil className="size-4" />
        </button>
        <button onClick={() => onDelete(property._id)} className="size-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 cursor-pointer border-none transition-colors" title="Delete">
          <Trash2 className="size-4" />
        </button>
      </div>
    </motion.div>
  );
}

function PropertyFormModal({ open, onClose, onSaved, editingProperty }) {
  const isEdit = !!editingProperty;
  const [form, setForm] = useState({
    propertyName: "", propertyType: "house", propertyAddress: "", city: "", state: "",
    pincode: "", country: "India", description: "", capacity: 1, pricePerHour: 0,
    securityDeposit: 0, rentType: "monthly", openingHour: 8, closingHour: 22,
    amenities: "",
  });
  const [amenityObjects, setAmenityObjects] = useState([]);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  useEffect(() => {
    if (editingProperty) {
      setForm({
        propertyName: editingProperty.propertyName || "",
        propertyType: editingProperty.propertyType || "house",
        propertyAddress: editingProperty.propertyAddress || "",
        city: editingProperty.city || "",
        state: editingProperty.state || "",
        pincode: editingProperty.pincode || "",
        country: editingProperty.country || "India",
        description: editingProperty.description || "",
        capacity: editingProperty.capacity || 1,
        pricePerHour: editingProperty.pricePerHour || 0,
        securityDeposit: editingProperty.securityDeposit || 0,
        rentType: editingProperty.rentType || "monthly",
        openingHour: editingProperty.openingHour || 8,
        closingHour: editingProperty.closingHour || 22,
        amenities: editingProperty.amenities?.join(", ") || "",
      });
      setPreviews(editingProperty.images || []);
    } else {
      setForm({ propertyName: "", propertyType: "house", propertyAddress: "", city: "", state: "", pincode: "", country: "India", description: "", capacity: 1, pricePerHour: 0, securityDeposit: 0, rentType: "monthly", openingHour: 8, closingHour: 22, amenities: "" });
      setImages([]);
      setPreviews([]);
    }
    setError("");
  }, [editingProperty, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFiles = (files) => {
    const arr = Array.from(files).slice(0, 5);
    setImages(arr);
    setPreviews(arr.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(img => fd.append("images", img));
      if (isEdit) {
        await api.patch(`/properties/${editingProperty._id}`, Object.fromEntries(Object.entries(form).map(([k, v]) => [k, k === "amenities" ? v.split(",").map(s => s.trim()).filter(Boolean) : v])));
      } else {
        if (images.length > 0) {
          const fda = new FormData();
          Object.entries(form).forEach(([k, v]) => {
            if (k === "amenities") fda.append(k, JSON.stringify(v.split(",").map(s => s.trim()).filter(Boolean)));
            else fda.append(k, v);
          });
          if (amenityObjects.length > 0) fda.append("amenityObjects", JSON.stringify(amenityObjects));
          images.forEach(img => fda.append("images", img));
          await api.post("/properties", fda, { headers: { "Content-Type": "multipart/form-data" } });
        } else {
          await api.post("/properties", { 
            ...form, 
            amenities: form.amenities.split(",").map(s => s.trim()).filter(Boolean),
            amenityObjects 
          }, { headers: { "Content-Type": "application/json" } });
        }
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Property" : "List New Property"} width="max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Image upload */}
        <div
          className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-6 text-center cursor-pointer transition-colors"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        >
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
          {previews.length > 0 ? (
            <div className="flex gap-2 flex-wrap justify-center">
              {previews.map((src, i) => (
                <img key={i} src={src} className="size-20 rounded-xl object-cover border border-slate-200" alt="preview" />
              ))}
            </div>
          ) : (
            <>
              <ImageIcon className="size-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">Drop images here or click to upload</p>
              <p className="text-xs text-slate-400 mt-1">Up to 5 images, JPG/PNG</p>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="form-label">Property Name *</label>
            <input className="form-input" required value={form.propertyName} onChange={e => set("propertyName", e.target.value)} placeholder="e.g. Sunset Villa" />
          </div>
          <div>
            <label className="form-label">Type *</label>
            <select className="form-input" value={form.propertyType} onChange={e => set("propertyType", e.target.value)}>
              {PROPERTY_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Rent Type *</label>
            <select className="form-input" value={form.rentType} onChange={e => set("rentType", e.target.value)}>
              {RENT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="form-label">Address *</label>
            <input className="form-input" required value={form.propertyAddress} onChange={e => set("propertyAddress", e.target.value)} placeholder="Street address" />
          </div>
          <div>
            <label className="form-label">City *</label>
            <input className="form-input" required value={form.city} onChange={e => set("city", e.target.value)} placeholder="City" />
          </div>
          <div>
            <label className="form-label">State *</label>
            <input className="form-input" required value={form.state} onChange={e => set("state", e.target.value)} placeholder="State" />
          </div>
          <div>
            <label className="form-label">Pincode *</label>
            <input className="form-input" required type="number" value={form.pincode} onChange={e => set("pincode", e.target.value)} placeholder="110001" />
          </div>
          <div>
            <label className="form-label">Country *</label>
            <input className="form-input" required value={form.country} onChange={e => set("country", e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="form-label">Description *</label>
            <textarea className="form-input h-24 resize-none" required value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe your property..." />
          </div>
          <div>
            <label className="form-label">Price (₹/{form.rentType === "monthly" ? "month" : "hour"}) *</label>
            <input className="form-input" required type="number" min={0} value={form.pricePerHour} onChange={e => set("pricePerHour", e.target.value)} />
          </div>
          <div>
            <label className="form-label">Security Deposit (₹) *</label>
            <input className="form-input" required type="number" min={0} value={form.securityDeposit} onChange={e => set("securityDeposit", e.target.value)} />
          </div>
          <div>
            <label className="form-label">Capacity *</label>
            <input className="form-input" required type="number" min={1} value={form.capacity} onChange={e => set("capacity", e.target.value)} />
          </div>
          {form.rentType === "hourly" && (
            <>
              <div>
                <label className="form-label">Opening Hour</label>
                <input className="form-input" type="number" min={0} max={23} value={form.openingHour} onChange={e => set("openingHour", e.target.value)} />
              </div>
              <div>
                <label className="form-label">Closing Hour</label>
                <input className="form-input" type="number" min={0} max={23} value={form.closingHour} onChange={e => set("closingHour", e.target.value)} />
              </div>
            </>
          )}
          {!isEdit && (
            <div className="col-span-2 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <label className="form-label mb-0">Bookable Amenities (Optional)</label>
                <button
                  type="button"
                  onClick={() => setAmenityObjects(prev => [...prev, { name: "", category: "general", capacity: 1, pricePerHour: 0 }])}
                  className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  + Add Amenity
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-3">Add real facilities (like Gym, Pool) that tenants can book separately.</p>
              
              {amenityObjects.map((am, i) => (
                <div key={i} className="p-3 mb-3 bg-slate-50 border border-slate-200 rounded-xl relative">
                  <button 
                    type="button"
                    onClick={() => setAmenityObjects(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-2 right-2 size-6 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200"
                  >
                    <Trash2 className="size-3" />
                  </button>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase">Name *</label>
                      <input className="form-input text-xs py-1.5" required value={am.name} onChange={e => {
                        const newAm = [...amenityObjects]; newAm[i].name = e.target.value; setAmenityObjects(newAm);
                      }} placeholder="e.g. Swimming Pool" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase">Category</label>
                      <select className="form-input text-xs py-1.5 bg-white" value={am.category} onChange={e => {
                        const newAm = [...amenityObjects]; newAm[i].category = e.target.value; setAmenityObjects(newAm);
                      }}>
                        <option value="gym">Gym</option>
                        <option value="swimmingpool">Swimming Pool</option>
                        <option value="clubhouse">Clubhouse</option>
                        <option value="general">General</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase">Capacity *</label>
                      <input className="form-input text-xs py-1.5" type="number" min={1} required value={am.capacity} onChange={e => {
                        const newAm = [...amenityObjects]; newAm[i].capacity = e.target.value; setAmenityObjects(newAm);
                      }} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase">Price/Hour (₹) *</label>
                      <input className="form-input text-xs py-1.5" type="number" min={0} required value={am.pricePerHour} onChange={e => {
                        const newAm = [...amenityObjects]; newAm[i].pricePerHour = e.target.value; setAmenityObjects(newAm);
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>}

        <div className="flex gap-3 pt-2">
          <GradientButton type="submit" loading={loading} icon={<CheckCircle2 className="size-4" />}>
            {isEdit ? "Save Changes" : "List Property"}
          </GradientButton>
          <GradientButton type="button" variant="ghost" onClick={onClose}>Cancel</GradientButton>
        </div>
      </form>
    </Modal>
  );
}

export default function Properties() {
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editProperty, setEditProperty] = useState(null);
  const [viewProp, setViewProp] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) setUser(JSON.parse(s));
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await api.get("/properties");
      if (res.data.success) setProperties(res.data.data.filter(p => {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        return p.owner?._id === u.id || p.owner === u.id;
      }));
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchProperties(); }, [user]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/properties/${id}`);
      fetchProperties();
    } catch {}
    setDeleteId(null);
  };

  const filtered = properties.filter(p =>
    !search || p.propertyName?.toLowerCase().includes(search.toLowerCase()) || p.city?.toLowerCase().includes(search.toLowerCase())
  );

  const totalTenants = properties.reduce((sum, p) => sum + (p.tenants?.length || 0), 0);
  const totalPending = properties.reduce((sum, p) => sum + (p.pendingTenants?.length || 0), 0);

  return (
    <Layout pageTitle="My Properties">
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto overflow-x-hidden">

        {/* Header */}
        <div className="flex flex-wrap items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">My Properties</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your listed properties and tenants</p>
          </div>
          <GradientButton onClick={() => setCreateOpen(true)} icon={<Plus className="size-4" />}>
            List Property
          </GradientButton>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard loading={loading} label="Total Properties" value={properties.length} icon={<Building2 className="size-5" />} color="blue" />
          <StatCard loading={loading} label="Active Tenants" value={totalTenants} icon={<Users className="size-5" />} color="green" />
          <StatCard loading={loading} label="Pending Requests" value={totalPending} icon={<Clock className="size-5" />} color="amber" />
        </div>

        {/* List */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-4 mb-5">
            <input
              className="form-input flex-1 max-w-xs"
              placeholder="Search properties..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Building2 className="size-8" />}
              title={search ? "No properties match" : "No properties yet"}
              description={search ? "Try a different search term" : "Start by listing your first property"}
              action={search ? undefined : () => setCreateOpen(true)}
              actionLabel="List Property"
            />
          ) : (
            <div className="flex flex-col divide-y divide-slate-50">
              {filtered.map(p => (
                <PropertyRow
                  key={p._id}
                  property={p}
                  onEdit={() => setEditProperty(p)}
                  onDelete={setDeleteId}
                  onView={setViewProp}
                />
              ))}
            </div>
          )}
        </GlassCard>

        {/* Create/Edit Modal */}
        <PropertyFormModal
          open={createOpen || !!editProperty}
          onClose={() => { setCreateOpen(false); setEditProperty(null); }}
          onSaved={fetchProperties}
          editingProperty={editProperty}
        />

        {/* Delete Confirm Modal */}
        <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Property" width="max-w-sm">
          <p className="text-slate-600 text-sm mb-5">Are you sure you want to delete this property? This action cannot be undone.</p>
          <div className="flex gap-3">
            <GradientButton variant="danger" onClick={() => handleDelete(deleteId)} icon={<Trash2 className="size-4" />}>Delete</GradientButton>
            <GradientButton variant="ghost" onClick={() => setDeleteId(null)}>Cancel</GradientButton>
          </div>
        </Modal>

        {/* View Property Modal */}
        <Modal open={!!viewProp} onClose={() => setViewProp(null)} title={viewProp?.propertyName || ""} width="max-w-xl">
          {viewProp && (
            <div className="flex flex-col gap-4">
              {viewProp.images?.[0] && (
                <img src={viewProp.images[0]} className="w-full h-48 object-cover rounded-xl" alt={viewProp.propertyName} />
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Address", value: `${viewProp.propertyAddress}, ${viewProp.city}` },
                  { label: "Price", value: `₹${viewProp.pricePerHour?.toLocaleString()}/${viewProp.rentType === "monthly" ? "mo" : "hr"}` },
                  { label: "Capacity", value: `${viewProp.capacity} people` },
                  { label: "Tenants", value: `${viewProp.tenants?.length || 0} / ${viewProp.capacity}` },
                  { label: "Deposit", value: `₹${viewProp.securityDeposit?.toLocaleString()}` },
                  { label: "Type", value: viewProp.propertyType },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl bg-slate-50">
                    <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-slate-900 capitalize">{value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm text-slate-700 leading-relaxed">{viewProp.description}</p>
              </div>
              {viewProp.amenities?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {viewProp.amenities.map(a => <Badge key={a} color="cyan">{a}</Badge>)}
                </div>
              )}
              {viewProp.pendingTenants?.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-xs font-bold text-amber-800 mb-2">{viewProp.pendingTenants.length} Pending Tenant Request(s)</p>
                  <p className="text-xs text-amber-700">Manage requests from your dashboard.</p>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}
