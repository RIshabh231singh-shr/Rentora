import { useState, useEffect, createContext, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Building2, Search, Wrench, Zap, Calendar,
  Bell, MessageSquare, User, Settings, LogOut, ChevronLeft,
  ChevronRight, Home, ShieldCheck, ChevronDown
} from "lucide-react";
import { Avatar, Toast, Modal, GradientButton } from "./ui";
import { io } from "socket.io-client";
import { authService } from "../services/authService";
import { userService } from "../services/userService";
import { dashboardService } from "../services/dashboardService";

/* ===================================================
   SIDEBAR CONTEXT
   =================================================== */
const SidebarCtx = createContext({ collapsed: false, toggle: () => {} });
export const useSidebar = () => useContext(SidebarCtx);

/* ===================================================
   NAV STRUCTURE
   =================================================== */
const buildNav = (role) => [
  {
    section: "Main",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, to: "/" },
    ],
  },
  {
    section: "Properties",
    items: [
      { label: "Browse", icon: Search, to: "/explore" },
      ...(role === "landlord" || role === "admin"
        ? [
            { label: "My Properties", icon: Building2, to: "/properties" },
            { label: "My Rentals", icon: Home, to: "/my-rentals" }
          ]
        : []
      ),
    ],
  },
  {
    section: "Bookings & Services",
    items: [
      { label: "My Bookings", icon: Calendar, to: "/bookings" },
      { label: "Maintenance", icon: Wrench, to: "/maintenance" },
      { label: "Amenities", icon: Zap, to: "/amenities" },
    ],
  },
  {
    section: "Connect",
    items: [
      { label: "Messages", icon: MessageSquare, to: "/messages" },
      { label: "Notifications", icon: Bell, to: "/notifications" },
    ],
  },
  {
    section: "Account",
    items: [
      { label: "Profile", icon: User, to: "/profile" },
      { label: "Settings", icon: Settings, to: "/settings" },
      ...(role === "admin"
        ? [{ label: "Admin Panel", icon: ShieldCheck, to: "/admin" }]
        : []
      ),
    ],
  },
];

/* ===================================================
   SIDEBAR COMPONENT
   =================================================== */
function Sidebar({ user, onLogout, notifCount }) {
  const { collapsed, toggle } = useSidebar();
  const location = useLocation();
  const nav = buildNav(user?.role);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [requestedRole, setRequestedRole] = useState("landlord");
  const [loadingRole, setLoadingRole] = useState(false);

  const handleRequestRole = async () => {
    setLoadingRole(true);
    try {
      await userService.requestRoleChange(requestedRole);
      alert("Role change requested successfully!");
      setRoleModalOpen(false);
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to request role");
    } finally {
      setLoadingRole(false);
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed left-0 top-0 h-screen z-50 glass-dark flex flex-col overflow-hidden"
    >
      {/* Logo */}
      <div className={`flex items-center h-[60px] px-4 border-b border-white/5 shrink-0 ${collapsed ? "justify-center" : "gap-3"}`}>
        <div className="size-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
          <Building2 className="size-4 text-white" />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className="text-white font-bold text-lg tracking-tight"
          >
            Rentora
          </motion.span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 flex flex-col gap-0.5">
        {nav.map((group) => (
          <div key={group.section} className="mb-2">
            {!collapsed && (
              <p className="nav-section-header mb-1">{group.section}</p>
            )}
            {group.items.map((item) => {
              const isActive = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`nav-item relative group ${isActive ? "active" : ""} ${collapsed ? "justify-center px-0" : ""}`}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="size-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                  {item.to === "/notifications" && notifCount > 0 && (
                    <span className={`${collapsed ? "absolute top-0.5 right-0.5" : "ml-auto"} inline-flex items-center justify-center size-4 rounded-full bg-red-500 text-white text-[9px] font-bold`}>
                      {notifCount > 9 ? "9+" : notifCount}
                    </span>
                  )}
                  {collapsed && (
                    <span className="sidebar-tooltip">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-2 border-t border-white/5 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1">
            <Avatar name={`${user?.firstname} ${user?.lastname}`} size="sm" src={user?.profilePicture} />
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.firstname} {user?.lastname}</p>
              <p className="text-slate-400 text-[11px] capitalize">{user?.role}</p>
            </div>
          </div>
        )}

        {user?.role !== "admin" && (
          <button
            onClick={() => setRoleModalOpen(true)}
            className={`nav-item w-full text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 ${collapsed ? "justify-center px-0" : ""}`}
          >
            <ShieldCheck className="size-4 shrink-0" />
            {!collapsed && <span>{user?.requestedRole ? "Role Requested" : "Request Role"}</span>}
            {collapsed && <span className="sidebar-tooltip">{user?.requestedRole ? "Role Requested" : "Request Role"}</span>}
          </button>
        )}

        <button
          onClick={onLogout}
          className={`nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 mt-1 ${collapsed ? "justify-center px-0" : ""}`}
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
          {collapsed && <span className="sidebar-tooltip">Sign Out</span>}
        </button>
        <button
          onClick={toggle}
          className={`nav-item w-full mt-1 ${collapsed ? "justify-center px-0" : ""}`}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <><ChevronLeft className="size-4" /><span>Collapse</span></>}
          {collapsed && <span className="sidebar-tooltip">Expand</span>}
        </button>
      </div>

      <Modal open={roleModalOpen} onClose={() => setRoleModalOpen(false)} title="Request Role Change" width="max-w-md">
        <div className="flex flex-col gap-4">
          {user?.requestedRole ? (
            <div className="p-4 bg-blue-50 text-blue-700 rounded-xl text-sm border border-blue-100">
              You already have a pending request for: <strong>{user.requestedRole}</strong>.
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Select the role you would like to request. An admin will review and approve your request.
              </p>
              <select
                value={requestedRole}
                onChange={e => setRequestedRole(e.target.value)}
                className="form-input text-slate-800 bg-white"
              >
                {user?.role !== "landlord" && <option value="landlord">Landlord</option>}
                {user?.role !== "maintenance_staff" && <option value="maintenance_staff">Maintenance Staff</option>}
                {user?.role !== "admin" && <option value="admin">Admin</option>}
              </select>
              <div className="flex gap-3 pt-2 mt-2 border-t border-slate-100">
                <GradientButton onClick={handleRequestRole} loading={loadingRole} className="w-full">
                  Submit Request
                </GradientButton>
              </div>
            </>
          )}
        </div>
      </Modal>

    </motion.aside>
  );
}

/* ===================================================
   TOPBAR COMPONENT
   =================================================== */
function Topbar({ user, pageTitle, notifications, onMarkRead, toasts, onDismissToast, onRoleAction }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { collapsed } = useSidebar();
  const navigate = useNavigate();
  const unread = notifications.filter(n => n.status === "unread");

  const handleNotifClick = async () => {
    setNotifOpen(v => !v);
    if (!notifOpen && unread.length > 0) {
      onMarkRead?.();
    }
  };

  return (
    <>
      <div
        className="topbar"
        style={{ left: collapsed ? 72 : 240 }}
      >
        {/* Page Title */}
        <h1 className="text-sm font-semibold text-slate-700 flex-1">{pageTitle}</h1>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={handleNotifClick}
            className="size-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 relative cursor-pointer border-none transition-colors"
          >
            <Bell className="size-4" />
            {unread.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unread.length > 9 ? "9+" : unread.length}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[100] overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <span className="font-bold text-slate-900 text-sm">Notifications</span>
                  <button
                    onClick={() => {
                      setNotifOpen(false);
                      navigate("/notifications");
                    }}
                    className="text-xs text-blue-600 font-semibold hover:text-blue-700 bg-transparent border-none cursor-pointer"
                  >
                    View all
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">No notifications yet</p>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n._id}
                        className={`px-4 py-3 border-b border-slate-50 last:border-0 transition-colors ${n.status === "unread" ? "bg-blue-50/40 hover:bg-blue-50/80" : "hover:bg-slate-50"}`}
                      >
                        <div 
                          className="cursor-pointer"
                          onClick={() => {
                            setNotifOpen(false);
                            navigate("/notifications");
                          }}
                        >
                          <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                        
                        {n.type === "ROLE_CHANGE_REQUEST" && user?.role === "admin" && !n.message.includes("approved") && !n.message.includes("rejected") && (
                          <div className="flex gap-2 mt-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); onRoleAction(n.relatedUser, "approve"); }}
                              className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors border-none cursor-pointer"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); onRoleAction(n.relatedUser, "reject"); }}
                              className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors border-none cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(v => !v)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 cursor-pointer border-none bg-transparent transition-colors"
          >
            <Avatar name={`${user?.firstname} ${user?.lastname}`} size="sm" src={user?.profilePicture} />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-900">{user?.firstname}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user?.role}</p>
            </div>
            <ChevronDown className="size-3 text-slate-400" />
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[100] py-1.5"
              >
                {[
                  { label: "Profile", to: "/profile", icon: User },
                  { label: "Settings", to: "/settings", icon: Settings },
                  { label: "Notifications", to: "/notifications", icon: Bell },
                ].map(({ label, to, icon: Icon }) => (
                  <button
                    key={to}
                    onClick={() => {
                      setProfileOpen(false);
                      navigate(to);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 border-none bg-transparent cursor-pointer text-left transition-colors font-medium"
                  >
                    <Icon className="size-4 text-slate-400" />
                    {label}
                  </button>
                ))}
                <hr className="my-1 border-slate-100" />
                <button
                  onClick={() => { 
                    setProfileOpen(false); 
                    navigate("/logout"); 
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 font-semibold hover:bg-red-50 cursor-pointer border-none bg-transparent text-left transition-colors"
                >
                  <LogOut className="size-4" />
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(profileOpen || notifOpen) && (
        <div
          className="fixed inset-0 z-[99]"
          onClick={() => { setProfileOpen(false); setNotifOpen(false); }}
        />
      )}

      {/* Toast notifications */}
      <Toast toasts={toasts} onDismiss={onDismissToast} />
    </>
  );
}

/* ===================================================
   MAIN LAYOUT WRAPPER
   =================================================== */
export default function Layout({ children, pageTitle = "Rentora" }) {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  const toggle = () => setCollapsed(v => !v);

  const handleRoleAction = async (userId, action) => {
    try {
      if (action === "approve") {
        await userService.approveRoleRequest(userId);
      } else {
        await userService.rejectRoleRequest(userId);
      }
      setNotifications(prev => prev.map(n => 
        n.relatedUser === userId && n.type === "ROLE_CHANGE_REQUEST" 
          ? { ...n, status: "read", message: `Role change to ${action}d.` } 
          : n
      ));
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} role`);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
    else navigate("/login");
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    dashboardService.getDashboardData().then(data => {
      setNotifications(data.notifications || []);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || "https://rentora-xonw.onrender.com";
    const socket = io(socketUrl);
    socket.emit("register", user._id || user.id);
    socket.on("notification", (data) => {
      const id = Date.now();
      const newNotif = {
        _id: data._id || String(id) + Math.random().toString(36).substring(7),
        title: data.title || "New Notification",
        message: data.message || "",
        status: data.status || "unread",
        createdAt: new Date().toISOString(),
        type: data.type,
        relatedUser: data.relatedUser,
        relatedBooking: data.relatedBooking
      };
      setNotifications(prev => {
        const existingIdx = prev.findIndex(n => n._id === newNotif._id);
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], ...newNotif };
          return updated;
        }
        
        if (prev.length > 0) {
          const last = prev[0];
          if (last.title === newNotif.title && last.message === newNotif.message && (Date.now() - new Date(last.createdAt).getTime() < 2000)) {
            return prev;
          }
        }
        return [newNotif, ...prev];
      });
      setToasts(prev => [...prev, { id, title: data.title, message: data.message, type: "info" }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
    });
    return () => {
      socket.off("notification");
      socket.disconnect();
    };
  }, [user]);

  const handleLogout = async () => {
    try { await authService.logout(); } catch {}
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleMarkRead = async () => {
    try {
      await dashboardService.markNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, status: "read" })));
    } catch (err) {
      console.error("Failed to mark notifications read");
    }
  };

  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const unreadCount = notifications.filter(n => n.status === "unread").length;

  if (!user) return null;

  return (
    <SidebarCtx.Provider value={{ collapsed, toggle }}>
      <div className="min-h-screen bg-mesh-gradient">
        <Sidebar
          user={user}
          onLogout={handleLogout}
          notifCount={unreadCount}
        />
        <Topbar
          user={user}
          pageTitle={pageTitle}
          notifications={notifications}
          onMarkRead={handleMarkRead}
          toasts={toasts}
          onDismissToast={dismissToast}
          onRoleAction={handleRoleAction}
        />
        <motion.main
          className="main-content"
          animate={{ marginLeft: collapsed ? 72 : 240 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
        >
          <motion.div
            key={pageTitle}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="min-h-[calc(100vh-60px)]"
          >
            {children}
          </motion.div>
        </motion.main>
      </div>
    </SidebarCtx.Provider>
  );
}
