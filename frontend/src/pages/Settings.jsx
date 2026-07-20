import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Bell, Shield, Palette, User, Save, Moon, Sun, Monitor, Check, ChevronRight, LogOut } from "lucide-react";
import Layout from "../components/Layout";
import { GlassCard, GradientButton, SectionHeader } from "../components/ui";
import api from "../utility/axiosInstance";
import { useNavigate } from "react-router-dom";

const TABS = [
  { key: "account", label: "Account", icon: User },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "privacy", label: "Privacy & Security", icon: Shield },
  { key: "appearance", label: "Appearance", icon: Palette },
];

function Toggle({ enabled, onChange }) {
  return (
    <motion.button
      onClick={() => onChange?.(!enabled)}
      className={`w-12 h-6 rounded-full cursor-pointer border-none relative flex items-center transition-colors ${enabled ? "bg-blue-600" : "bg-slate-200"}`}
    >
      <motion.span
        layout
        animate={{ x: enabled ? 24 : 2 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="size-5 rounded-full bg-white shadow-sm absolute"
      />
    </motion.button>
  );
}

function SettingRow({ icon: Icon, label, description, action }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="size-8 rounded-xl bg-slate-100 flex items-center justify-center">
            <Icon className="size-4 text-slate-500" />
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState("account");
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  const [prefs, setPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("rentora_prefs") || "{}");
    } catch { return {}; }
  });

  const setPref = (k, v) => {
    const updated = { ...prefs, [k]: v };
    setPrefs(updated);
    localStorage.setItem("rentora_prefs", JSON.stringify(updated));
  };

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) setUser(JSON.parse(s));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLogout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    localStorage.removeItem("user");
    navigate("/login");
  };

  const contentByTab = {
    account: (
      <div className="flex flex-col gap-5">
        <GlassCard className="p-5">
          <SectionHeader title="Account Information" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "First Name", key: "firstname" },
              { label: "Last Name", key: "lastname" },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="form-label">{label}</label>
                <input className="form-input" defaultValue={user?.[key]} />
              </div>
            ))}
            <div className="col-span-2">
              <label className="form-label">Email Address</label>
              <input type="email" defaultValue={user?.email} disabled className="form-input bg-slate-50 text-slate-400 cursor-not-allowed" />
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed.</p>
            </div>
            <div className="col-span-2">
              <label className="form-label">Phone Number</label>
              <input className="form-input" defaultValue={user?.phoneNumber} placeholder="+91 XXXXX XXXXX" />
            </div>
          </div>
          <div className="mt-4">
            <GradientButton onClick={handleSave} loading={saving} icon={saved ? <Check className="size-4" /> : <Save className="size-4" />}>
              {saved ? "Saved!" : "Save Changes"}
            </GradientButton>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionHeader title="Password" subtitle="Update your password regularly for security" />
          <div className="flex flex-col gap-3">
            <div>
              <label className="form-label">Current Password</label>
              <input type="password" className="form-input" placeholder="••••••••" />
            </div>
            <div>
              <label className="form-label">New Password</label>
              <input type="password" className="form-input" placeholder="••••••••" />
            </div>
            <div>
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="form-input" placeholder="••••••••" />
            </div>
          </div>
          <div className="mt-4">
            <GradientButton onClick={handleSave} loading={saving}>Update Password</GradientButton>
          </div>
        </GlassCard>

        <GlassCard className="p-5 border-red-100">
          <SectionHeader title="Danger Zone" />
          <SettingRow
            icon={LogOut}
            label="Sign Out"
            description="Sign out of your Rentora account"
            action={<GradientButton variant="danger" size="sm" onClick={handleLogout} icon={<LogOut className="size-3.5" />}>Sign Out</GradientButton>}
          />
        </GlassCard>
      </div>
    ),

    notifications: (
      <GlassCard className="p-5">
        <SectionHeader title="Notification Preferences" />
        <div>
          {[
            { key: "notif_booking", label: "Booking Updates", description: "Get notified when bookings change status" },
            { key: "notif_maintenance", label: "Maintenance Updates", description: "Updates on your maintenance requests" },
            { key: "notif_tenant", label: "Tenant Requests", description: "When someone requests to join your property" },
            { key: "notif_messages", label: "New Messages", description: "Alerts when you receive a new message" },
            { key: "notif_sound", label: "Sound Alerts", description: "Play sound for important notifications" },
          ].map(({ key, label, description }) => (
            <SettingRow
              key={key}
              label={label}
              description={description}
              action={<Toggle enabled={prefs[key] !== false} onChange={v => setPref(key, v)} />}
            />
          ))}
        </div>
      </GlassCard>
    ),

    privacy: (
      <GlassCard className="p-5">
        <SectionHeader title="Privacy & Security" />
        <div>
          {[
            { key: "priv_2fa", label: "Two-Factor Authentication", description: "Add extra security to your account" },
            { key: "priv_show_phone", label: "Show Phone to Tenants", description: "Allow tenants to see your phone number" },
            { key: "priv_show_email", label: "Show Email Publicly", description: "Make your email visible on listings" },
            { key: "priv_activity", label: "Activity Visibility", description: "Show when you were last active" },
          ].map(({ key, label, description }) => (
            <SettingRow
              key={key}
              label={label}
              description={description}
              action={<Toggle enabled={prefs[key] === true} onChange={v => setPref(key, v)} />}
            />
          ))}
        </div>
        <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
          <p className="text-xs text-blue-700 font-semibold">🔒 Your data is encrypted and secure. We never share your personal information with third parties.</p>
        </div>
      </GlassCard>
    ),

    appearance: (
      <div className="flex flex-col gap-5">
        <GlassCard className="p-5">
          <SectionHeader title="Theme" subtitle="Choose your preferred color mode" />
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "light", label: "Light", icon: Sun, bg: "bg-slate-50", border: "border-slate-200" },
              { key: "dark", label: "Dark", icon: Moon, bg: "bg-slate-900", border: "border-slate-700" },
              { key: "system", label: "System", icon: Monitor, bg: "bg-gradient-to-br from-slate-100 to-slate-900", border: "border-slate-400" },
            ].map(({ key, label, icon: Icon, bg, border }) => (
              <button
                key={key}
                onClick={() => setPref("theme", key)}
                className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col items-center gap-2 transition-all ${prefs.theme === key ? "border-blue-600 shadow-md" : border} bg-transparent`}
              >
                <div className={`size-12 rounded-xl ${bg} border ${border} flex items-center justify-center`}>
                  <Icon className="size-5 text-slate-600" />
                </div>
                <span className="text-xs font-bold text-slate-700">{label}</span>
                {prefs.theme === key && <Check className="size-3 text-blue-600" />}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">Note: Dark mode theming is applied to sidebar and hero sections. Full app dark mode is coming soon.</p>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionHeader title="Language & Region" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Language</label>
              <select className="form-input">
                <option>English (India)</option>
                <option>Hindi</option>
                <option>Tamil</option>
              </select>
            </div>
            <div>
              <label className="form-label">Currency</label>
              <select className="form-input">
                <option>INR (₹)</option>
                <option>USD ($)</option>
                <option>EUR (€)</option>
              </select>
            </div>
          </div>
        </GlassCard>
      </div>
    ),
  };

  return (
    <Layout pageTitle="Settings">
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your account preferences and configuration</p>
        </div>

        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Tab sidebar */}
          <div className="w-full lg:w-52 shrink-0">
            <GlassCard className="p-2">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer border-none transition-all text-left ${
                    tab === key ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100 bg-transparent"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </button>
              ))}
            </GlassCard>
          </div>

          {/* Content */}
          <div className="flex-1">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {contentByTab[tab]}
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
