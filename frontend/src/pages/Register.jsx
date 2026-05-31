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
  User,
  Home,
  Shield,
  Phone,
} from "lucide-react";
import api from "../utility/axiosInstance";
import LeftPanel from "../components/LeftPanel";

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

// Define Register Schema with Zod
const registerSchema = z.object({
  firstname: z
    .string()
    .min(1, "First name is required")
    .min(3, "First name must be at least 3 characters")
    .max(40, "First name cannot exceed 40 characters"),
  lastname: z
    .string()
    .refine((val) => val === "" || (val.length >= 3 && val.length <= 40), {
      message: "Last name must be between 3 and 40 characters",
    })
    .optional(),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .length(10, "Phone number must be exactly 10 digits")
    .regex(/^\d+$/, "Phone number must contain only numbers"),
  password: z
    .string()
    .min(1, "Password is required")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 symbol"
    ),
  role: z.enum(["tenant", "landlord", "admin"]),
});

export default function Register() {
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
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      email: "",
      phoneNumber: "",
      password: "",
      role: "tenant",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data) => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = {
        firstname: data.firstname,
        lastname: data.lastname || undefined,
        email: data.email,
        phoneNumber: data.phoneNumber,
        role: data.role,
        password: data.password,
      };

      const response = await api.post("/auth/register", payload);
      setSuccess("Account created successfully! Redirecting...");
      
      localStorage.setItem("user", JSON.stringify(response.data.userData));
      
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Registration failed. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setError("Google Sign-In is not configured yet. Please use the email and password form.");
  };

  const roles = [
    { id: "tenant", label: "Tenant", icon: User },
    { id: "landlord", label: "Property Owner", icon: Home },
    { id: "admin", label: "Admin", icon: Shield },
  ];

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
                  onClick={() => navigate("/login")}
                  className="font-medium rounded-md text-sm leading-5 py-2 flex-1 transition-all cursor-pointer text-[#71717b] hover:text-zinc-950"
                >
                  Login
                </button>
                <button
                  type="button"
                  className="font-semibold rounded-md text-sm leading-5 py-2 flex-1 transition-all cursor-pointer bg-white text-[#2b7fff] shadow-sm border-zinc-200 border"
                >
                  Sign Up
                </button>
              </div>

              {/* Title & Description */}
              <div className="flex flex-col gap-1">
                <h2 className="font-bold text-blue-900 text-2xl leading-8 tracking-tight">
                  Create Account
                </h2>
                <p className="text-[#71717b] text-sm leading-5">
                  Sign up for a Rentora account
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
              
              {/* Register fields: First Name & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label
                    className="font-medium text-zinc-950 text-xs leading-4"
                    htmlFor="firstname"
                  >
                    First Name *
                  </label>
                  <div className="relative">
                    <User className="top-1/2 size-4 -translate-y-1/2 text-[#71717b] absolute left-3 pointer-events-none" />
                    <input
                      className={`w-full border border-solid rounded-xl py-2 pl-9 pr-4 text-zinc-950 placeholder-zinc-400 outline-none focus:ring-1 text-sm transition-all ${
                        errors.firstname
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-zinc-200 focus:border-[#2b7fff] focus:ring-[#2b7fff]"
                      }`}
                      id="firstname"
                      placeholder="John"
                      type="text"
                      {...register("firstname")}
                    />
                  </div>
                  {errors.firstname && (
                    <span className="text-red-500 text-xs leading-normal">{errors.firstname.message}</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    className="font-medium text-zinc-950 text-xs leading-4"
                    htmlFor="lastname"
                  >
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="top-1/2 size-4 -translate-y-1/2 text-[#71717b] absolute left-3 pointer-events-none" />
                    <input
                      className={`w-full border border-solid rounded-xl py-2 pl-9 pr-4 text-zinc-950 placeholder-zinc-400 outline-none focus:ring-1 text-sm transition-all ${
                        errors.lastname
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-zinc-200 focus:border-[#2b7fff] focus:ring-[#2b7fff]"
                      }`}
                      id="lastname"
                      placeholder="Doe"
                      type="text"
                      {...register("lastname")}
                    />
                  </div>
                  {errors.lastname && (
                    <span className="text-red-500 text-xs leading-normal">{errors.lastname.message}</span>
                  )}
                </div>
              </div>

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

              {/* Register field: Phone Number */}
              <div className="flex flex-col gap-2">
                <label
                  className="font-medium text-zinc-950 text-xs leading-4"
                  htmlFor="phoneNumber"
                >
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="top-1/2 size-4 -translate-y-1/2 text-[#71717b] absolute left-3 pointer-events-none" />
                  <input
                    className={`w-full border border-solid rounded-xl py-2 pl-9 pr-4 text-zinc-950 placeholder-zinc-400 outline-none focus:ring-1 text-sm transition-all ${
                      errors.phoneNumber
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-zinc-200 focus:border-[#2b7fff] focus:ring-[#2b7fff]"
                    }`}
                    id="phoneNumber"
                    placeholder="9876543210"
                    type="tel"
                    maxLength="10"
                    {...register("phoneNumber")}
                  />
                </div>
                {errors.phoneNumber && (
                  <span className="text-red-500 text-xs leading-normal">{errors.phoneNumber.message}</span>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <label
                  className="font-medium text-zinc-950 text-xs leading-4"
                  htmlFor="password"
                >
                  Password *
                </label>
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
                {errors.password ? (
                  <span className="text-red-500 text-xs leading-normal">{errors.password.message}</span>
                ) : (
                  <span className="text-[10px] text-zinc-500 leading-tight">
                    Must be at least 8 characters with uppercase, lowercase, number, and special symbol.
                  </span>
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
                    <span>Signing Up...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="size-4" />
                    <span>Sign Up</span>
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
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="bg-white text-zinc-950 border border-zinc-200 border-solid hover:bg-zinc-50 w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all text-sm shadow-sm"
              >
                <GoogleIcon className="size-4 shrink-0" />
                Continue with Google
              </button>

              {/* Role Selection */}
              <div className="flex flex-col gap-2 mt-2">
                <span className="font-medium text-[#71717b] text-xs leading-4">
                  Select your role
                </span>
                <div className="flex items-center gap-2">
                  {roles.map((r) => {
                    const Icon = r.icon;
                    const active = selectedRole === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setValue("role", r.id)}
                        className={`font-medium rounded-full text-xs leading-4 flex py-2.5 justify-center items-center flex-1 gap-1.5 transition-all cursor-pointer border border-solid ${
                          active
                            ? "bg-[#2b7fff] text-blue-50 border-[#2b7fff] font-semibold"
                            : "bg-white text-zinc-950 border-zinc-200 hover:bg-zinc-50"
                        }`}
                      >
                        <Icon className="size-3.5" />
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>

            {/* Footer switcher text */}
            <div className="flex justify-center border-t border-zinc-100 pt-4">
              <p className="text-[#71717b] text-xs sm:text-sm leading-5">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-[#2b7fff] hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
