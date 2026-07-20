import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, Mail, ArrowLeft, KeyRound, Lock, CheckCircle2 } from "lucide-react";
import api from "../utility/axiosInstance";

export default function ForgotPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  // Common State
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Step 1 State: Email
  const prefilledEmail = location.state?.email || "";
  const [email, setEmail] = useState(prefilledEmail);

  // Step 2 State: OTP
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const inputRefs = useRef([]);

  // Step 3 State: New Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- Handlers for Step 1 ---
  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSuccess("An OTP has been sent to your email.");
      setTimeout(() => {
        setSuccess("");
        setStep(2);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers for Step 2 ---
  const handleOtpChange = (element, index) => {
    if (!/^\d*$/.test(element.value)) return;

    setOtp((prev) => {
      const newOtp = [...prev];
      newOtp[index] = element.value;
      return newOtp;
    });

    // Focus next input
    if (element.nextSibling && element.value !== "") {
      element.nextSibling.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && e.target.previousSibling) {
        e.target.previousSibling.focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").slice(0, 6).split("");
    if (!pastedData.every((char) => /^\d$/.test(char))) return;

    setOtp((prev) => {
      let newOtp = [...prev];
      pastedData.forEach((char, index) => {
        newOtp[index] = char;
      });
      return newOtp;
    });

    const lastFilledIndex = pastedData.length - 1;
    if (inputRefs.current[lastFilledIndex]) {
      inputRefs.current[lastFilledIndex].focus();
    }
  };

  const handleContinueToPassword = (e) => {
    e.preventDefault();
    if (otp.join("").length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }
    setError("");
    setStep(3);
  };

  // --- Handlers for Step 3 ---
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", {
        email,
        otp: otp.join(""),
        newPassword,
      });
      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-50 w-screen h-screen flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none animate-pulse duration-1000"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-96 h-96 bg-teal-50/50 rounded-full blur-3xl pointer-events-none animate-pulse duration-[3000ms]"></div>

      <div className="max-w-md w-full bg-white/70 backdrop-blur-xl border border-white rounded-3xl p-8 sm:p-10 flex flex-col gap-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] z-10 relative overflow-hidden transition-all duration-500">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="size-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-2 shadow-inner group transition-all">
            {step === 1 && <KeyRound className="size-7 text-blue-600 group-hover:scale-110 transition-transform" />}
            {step === 2 && <Mail className="size-7 text-blue-600 animate-bounce" />}
            {step === 3 && <Lock className="size-7 text-blue-600 group-hover:scale-110 transition-transform" />}
          </div>
          <h2 className="font-bold text-zinc-900 text-2xl tracking-tight">
            {step === 1 && "Forgot Password?"}
            {step === 2 && "Enter OTP"}
            {step === 3 && "New Password"}
          </h2>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
            {step === 1 && "No worries, we'll send you reset instructions."}
            {step === 2 && (
              <>
                We sent a 6-digit code to <br />
                <span className="font-medium text-zinc-900">{email}</span>
              </>
            )}
            {step === 3 && "Your new password must be different from previous used passwords."}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-2 animate-in fade-in zoom-in duration-200">
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 text-sm flex items-start gap-2 animate-in fade-in zoom-in duration-200">
            <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{success}</span>
          </div>
        )}

        {/* Forms Container based on Step */}
        <div className="w-full">
          {step === 1 && (
            <form onSubmit={handleRequestReset} className="flex flex-col gap-6 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="flex flex-col gap-2">
                <label className="font-medium text-zinc-950 text-sm leading-4" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="top-1/2 size-4 -translate-y-1/2 text-zinc-400 absolute left-3 pointer-events-none" />
                  <input
                    className={`w-full border border-zinc-200 rounded-xl py-2.5 pl-9 pr-4 text-sm transition-all bg-white ${prefilledEmail ? "text-zinc-500 bg-zinc-50 cursor-not-allowed" : "text-zinc-950 placeholder-zinc-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"}`}
                    id="email"
                    placeholder="Enter your email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      if (!prefilledEmail) setEmail(e.target.value);
                    }}
                    readOnly={!!prefilledEmail}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 active:scale-[0.98] mt-2"
              >
                {loading ? <Loader2 className="size-5 animate-spin" /> : "Reset Password"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleContinueToPassword} className="flex flex-col gap-6 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="flex justify-between gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                {otp.map((data, index) => (
                  <input
                    className="w-full h-14 sm:h-16 border border-zinc-200 rounded-2xl text-center text-xl sm:text-2xl font-bold text-zinc-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none bg-white shadow-sm"
                    type="text"
                    maxLength="1"
                    key={index}
                    value={data}
                    ref={(el) => (inputRefs.current[index] = el)}
                    onChange={(e) => handleOtpChange(e.target, index)}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={otp.join("").length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 active:scale-[0.98] mt-2"
              >
                Continue
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-6 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-zinc-950 text-sm leading-4" htmlFor="newPassword">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="top-1/2 size-4 -translate-y-1/2 text-zinc-400 absolute left-3 pointer-events-none" />
                    <input
                      className="w-full border border-zinc-200 rounded-xl py-2.5 pl-9 pr-4 text-zinc-950 placeholder-zinc-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm transition-all bg-white"
                      id="newPassword"
                      placeholder="Enter new password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-medium text-zinc-950 text-sm leading-4" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="top-1/2 size-4 -translate-y-1/2 text-zinc-400 absolute left-3 pointer-events-none" />
                    <input
                      className="w-full border border-zinc-200 rounded-xl py-2.5 pl-9 pr-4 text-zinc-950 placeholder-zinc-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm transition-all bg-white"
                      id="confirmPassword"
                      placeholder="Confirm new password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 active:scale-[0.98] mt-2"
              >
                {loading ? <Loader2 className="size-5 animate-spin" /> : "Save New Password"}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-4 mt-2">
          {step === 2 && (
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOtp(new Array(6).fill(""));
                setError("");
                setSuccess("");
              }}
              className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Didn't receive it? Resend
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back to login
          </button>
        </div>

      </div>
    </div>
  );
}
