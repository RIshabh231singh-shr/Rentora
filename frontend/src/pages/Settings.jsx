import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Shield, Palette, User, Save, Moon, Sun, Monitor, Check, LogOut } from "lucide-react";
import Layout from "../components/Layout";
import { GlassCard, GradientButton, SectionHeader } from "../components/ui";
import api from "../utility/axiosInstance";
import { useNavigate } from "react-router-dom";

const TABS = [
  { key: "account", label: "Account", icon: User }
];



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



  const [profileForm, setProfileForm] = useState({ firstname: "", lastname: "", phoneNumber: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passMsg, setPassMsg] = useState("");
  const [profMsg, setProfMsg] = useState("");

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) {
      const u = JSON.parse(s);
      setUser(u);
      setProfileForm({ firstname: u.firstname || "", lastname: u.lastname || "", phoneNumber: u.phoneNumber || "" });
    }
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    setProfMsg("");
    try {
      await api.patch("/auth/profile", profileForm);
      const updated = { ...user, ...profileForm };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      setSaved(true);
      setProfMsg("Profile updated successfully!");
      setTimeout(() => { setSaved(false); setProfMsg(""); }, 2500);
    } catch (err) {
      setProfMsg(err.response?.data?.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPassMsg("New passwords do not match.");
      return;
    }
    setSaving(true);
    setPassMsg("");
    try {
      await api.patch("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPassMsg("Password updated successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPassMsg(err.response?.data?.message || "Failed to update password.");
    } finally {
      setSaving(false);
    }
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
                <input className="form-input" value={profileForm[key]} onChange={e => setProfileForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div className="col-span-2">
              <label className="form-label">Email Address</label>
              <input type="email" defaultValue={user?.email} disabled className="form-input bg-slate-50 text-slate-400 cursor-not-allowed" />
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed.</p>
            </div>
            <div className="col-span-2">
              <label className="form-label">Phone Number</label>
              <input className="form-input" value={profileForm.phoneNumber} onChange={e => setProfileForm(f => ({ ...f, phoneNumber: e.target.value }))} placeholder="+91 XXXXX XXXXX" />
            </div>
          </div>
          {profMsg && <p className={`text-sm mt-3 font-medium ${profMsg.includes("success") ? "text-emerald-600" : "text-red-600"}`}>{profMsg}</p>}
          <div className="mt-4">
            <GradientButton onClick={handleSaveProfile} loading={saving} icon={saved ? <Check className="size-4" /> : <Save className="size-4" />}>
              {saved ? "Saved!" : "Save Changes"}
            </GradientButton>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <SectionHeader title="Password" subtitle="Update your password regularly for security" />
          <div className="flex flex-col gap-3">
            <div>
              <label className="form-label">Current Password</label>
              <input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))} className="form-input" placeholder="••••••••" />
            </div>
            <div>
              <label className="form-label">New Password</label>
              <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))} className="form-input" placeholder="••••••••" />
            </div>
            <div>
              <label className="form-label">Confirm New Password</label>
              <input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))} className="form-input" placeholder="••••••••" />
            </div>
          </div>
          {passMsg && <p className={`text-sm mt-3 font-medium ${passMsg.includes("success") ? "text-emerald-600" : "text-red-600"}`}>{passMsg}</p>}
          <div className="mt-4">
            <GradientButton onClick={handleUpdatePassword} loading={saving}>Update Password</GradientButton>
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
    )
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
