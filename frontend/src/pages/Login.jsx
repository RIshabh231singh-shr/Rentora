import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Lock,
  LogIn,
  Mail,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import api from "../utility/axiosInstance";
import LeftPanel from "../components/LeftPanel";
import GoogleAuth from "../components/GoogleAuth";

// Premium Custom Google Icon
const GoogleIcon = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// Define Login Schema with Zod
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const navigate = useNavigate();

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Setup react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await api.post("/api/auth/login", {
        email: data.email,
        password: data.password,
      });
      setSuccess("Logged in successfully! Redirecting...");
      
      localStorage.setItem("user", JSON.stringify(response.data.userData));
      
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403 && err.response?.data?.requiresVerification) {
        setError(err.response.data.message || "Account not verified. Redirecting...");
        setTimeout(() => {
          navigate("/verify-email", { state: { email: data.email } });
        }, 1500);
      } else {
        setError(err.response?.data?.message || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setError("Password reset is not configured yet. Please contact support or try a different account.");
  };

  return (
    <div className="bg-white text-zinc-950 w-screen h-screen flex items-stretch overflow-hidden font-sans">
      <div className="flex w-full h-full">
        
        {/* Left branding panel */}
        <LeftPanel />

        {/* Right form panel - fixed height, not scrollable itself */}
        <div className="w-full md:w-1/2 bg-white flex p-4 sm:p-8 justify-center items-center h-full overflow-hidden">
          {/* Card container - scrolls internally if content height exceeds viewport */}
          <div className="max-w-md w-full border border-zinc-200 border-solid rounded-2xl p-6 sm:p-8 flex flex-col gap-6 bg-white shadow-sm max-h-[calc(100vh-2rem)] overflow-y-auto">
            
            {/* Header: Tab Switcher */}
            <div className="flex flex-col gap-6">
              <div className="rounded-lg bg-zinc-100 flex p-1 items-center w-full">
                <button
                  type="button"
                  className="font-semibold rounded-md text-sm leading-5 py-2 flex-1 transition-all cursor-pointer bg-white text-[#2b7fff] shadow-sm border-zinc-200 border"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="font-medium rounded-md text-sm leading-5 py-2 flex-1 transition-all cursor-pointer text-[#71717b] hover:text-zinc-950"
                >
                  Sign Up
                </button>
              </div>

              {/* Title & Description */}
              <div className="flex flex-col gap-1">
                <h2 className="font-bold text-blue-900 text-2xl leading-8 tracking-tight">
                  Welcome Back
                </h2>
                <p className="text-[#71717b] text-sm leading-5">
                  Sign in to your Rentora account
                </p>
              </div>
            </div>

            {/* Error and Success Alerts */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5"></span>
                <span className="leading-relaxed">{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 text-sm flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-1.5"></span>
                <span className="leading-relaxed">{success}</span>
              </div>
            )}

            {/* Form Content */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              
              {/* Email Address */}
              <div className="flex flex-col gap-2">
                <label
                  className="font-medium text-zinc-950 text-xs leading-4"
                  htmlFor="email"
                >
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="top-1/2 size-4 -translate-y-1/2 text-[#71717b] absolute left-3 pointer-events-none" />
                  <input
                    className={`w-full border border-solid rounded-xl py-2 pl-9 pr-4 text-zinc-950 placeholder-zinc-400 outline-none focus:ring-1 text-sm transition-all ${
                      errors.email
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-zinc-200 focus:border-[#2b7fff] focus:ring-[#2b7fff]"
                    }`}
                    id="email"
                    placeholder="you@example.com"
                    type="email"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <span className="text-red-500 text-xs leading-normal">{errors.email.message}</span>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label
                    className="font-medium text-zinc-950 text-xs leading-4"
                    htmlFor="password"
                  >
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="font-medium text-[#2b7fff] text-xs leading-4 cursor-pointer hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="top-1/2 size-4 -translate-y-1/2 text-[#71717b] absolute left-3 pointer-events-none" />
                  <input
                    className={`w-full border border-solid rounded-xl py-2 pl-9 pr-10 text-zinc-950 placeholder-zinc-400 outline-none focus:ring-1 text-sm transition-all ${
                      errors.password
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-zinc-200 focus:border-[#2b7fff] focus:ring-[#2b7fff]"
                    }`}
                    id="password"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && (
                  <span className="text-red-500 text-xs leading-normal">{errors.password.message}</span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="bg-[#2b7fff] hover:bg-[#1a66d9] text-blue-50 w-full py-2.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-sm text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="size-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>

              {/* OAuth Splitter */}
              <div className="flex items-center gap-4 py-1">
                <div className="bg-zinc-200 flex-1 h-px" />
                <span className="text-[#71717b] text-xs leading-4 shrink-0">
                  or continue with
                </span>
                <div className="bg-zinc-200 flex-1 h-px" />
              </div>

              {/* Google Button */}
              <GoogleAuth
                onSuccess={(userData) => {
                  setSuccess("Logged in successfully! Redirecting...");
                  localStorage.setItem("user", JSON.stringify(userData));
                  setTimeout(() => {
                    navigate("/");
                  }, 1000);
                }}
                onError={(errMsg) => setError(errMsg)}
                text="signin_with"
              />
            </form>

            {/* Footer switcher text */}
            <div className="flex justify-center border-t border-zinc-100 pt-4">
              <p className="text-[#71717b] text-xs sm:text-sm leading-5">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-[#2b7fff] hover:underline"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
