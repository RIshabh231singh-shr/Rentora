import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, Mail, ArrowLeft, RefreshCw } from "lucide-react";
import api from "../utility/axiosInstance";

export default function VerifyEmail() {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [resendDisabled, setResendDisabled] = useState(false);
  const [timer, setTimer] = useState(60);

  const location = useLocation();
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate("/login");
    }
  }, [email, navigate]);

  useEffect(() => {
    let interval;
    if (resendDisabled && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [resendDisabled, timer]);

  const handleChange = (element, index) => {
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

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && e.target.previousSibling) {
        e.target.previousSibling.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").slice(0, 6).split("");
    if (!pastedData.every(char => /^\d$/.test(char))) return;
    
    setOtp((prev) => {
      let newOtp = [...prev];
      pastedData.forEach((char, index) => {
        newOtp[index] = char;
      });
      return newOtp;
    });
    
    // Focus last filled input
    const lastFilledIndex = pastedData.length - 1;
    if (inputRefs.current[lastFilledIndex]) {
      inputRefs.current[lastFilledIndex].focus();
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/auth/verify-otp", { email, otp: otpValue });
      setSuccess("Email verified successfully! Redirecting...");
      localStorage.setItem("user", JSON.stringify(response.data.userData));
      
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");
    try {
      await api.post("/api/auth/resend-otp", { email });
      setSuccess("A new OTP has been sent to your email.");
      setResendDisabled(true);
      setTimer(60);
      setOtp(new Array(6).fill(""));
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
    }
  };

  if (!email) return null;

  return (
    <div className="bg-zinc-50 w-screen h-screen flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-96 h-96 bg-teal-50/50 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-white/70 backdrop-blur-xl border border-white rounded-3xl p-8 sm:p-10 flex flex-col gap-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] z-10 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="size-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-2 shadow-inner">
            <Mail className="size-7 text-blue-600" />
          </div>
          <h2 className="font-bold text-zinc-900 text-2xl tracking-tight">Check your email</h2>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
            We sent a verification code to <br/>
            <span className="font-medium text-zinc-900">{email}</span>
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-2 animate-in fade-in zoom-in duration-200">
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-100 text-teal-600 text-sm flex items-start gap-2 animate-in fade-in zoom-in duration-200">
            <span className="leading-relaxed font-medium">{success}</span>
          </div>
        )}

        <form onSubmit={verifyOtp} className="flex flex-col gap-8">
          <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
            {otp.map((data, index) => {
              return (
                <input
                  className="w-full h-14 sm:h-16 border border-zinc-200 rounded-2xl text-center text-xl sm:text-2xl font-bold text-zinc-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none bg-white shadow-sm"
                  type="text"
                  name="otp"
                  maxLength="1"
                  key={index}
                  value={data}
                  ref={(el) => (inputRefs.current[index] = el)}
                  onChange={(e) => handleChange(e.target, index)}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
              );
            })}
          </div>

          <button
            type="submit"
            disabled={loading || otp.join("").length !== 6}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              "Verify Account"
            )}
          </button>
        </form>

        <div className="flex flex-col items-center gap-4 mt-2">
          <button
            type="button"
            disabled={resendDisabled}
            onClick={handleResend}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`size-3.5 ${resendDisabled ? "" : "hover:rotate-180 transition-transform duration-500"}`} />
            {resendDisabled ? `Resend code in ${timer}s` : "Didn't receive a code? Resend"}
          </button>
          
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
