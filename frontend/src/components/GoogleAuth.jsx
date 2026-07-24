import { useState, useEffect, useRef } from "react";
import { Phone, Loader2 } from "lucide-react";
import api from "../utility/axiosInstance";

export default function GoogleAuth({ onSuccess, onError, text = "signin_with" }) {
  // Google OAuth states
  const [googleUser, setGoogleUser] = useState(null);
  const [googleCredential, setGoogleCredential] = useState("");
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [modalPhone, setModalPhone] = useState("");
  const [modalRole, setModalRole] = useState("tenant");
  const [modalError, setModalError] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  const handleGoogleResponse = async (response) => {
    if (onError) onError("");
    try {
      const { credential } = response;
      const res = await api.post("/api/auth/google-login", { credential });
      
      if (res.data.isNewGoogleUser) {
        setGoogleUser(res.data.googleData);
        setGoogleCredential(credential);
        setIsNewUserModalOpen(true);
      } else {
        if (onSuccess) onSuccess(res.data.userData);
      }
    } catch (err) {
      console.error(err);
      if (onError) onError(err.response?.data?.message || "Google Authentication failed");
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError("");
    setModalLoading(true);

    try {
      if (!modalPhone || modalPhone.length !== 10 || !/^\d+$/.test(modalPhone)) {
        throw new Error("Phone number must be exactly 10 digits");
      }

      const res = await api.post("/api/auth/google-register", {
        credential: googleCredential,
        phoneNumber: modalPhone,
        role: modalRole,
      });

      setIsNewUserModalOpen(false);
      if (onSuccess) onSuccess(res.data.userData);
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || err.message || "Registration failed");
    } finally {
      setModalLoading(false);
    }
  };

  const googleBtnRef = useRef(null);

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(
          googleBtnRef.current,
          { 
            theme: "outline", 
            size: "large", 
            width: "100%",
            text: text,
            shape: "rectangular"
          }
        );
      }
    };

    const checkGoogleInterval = setInterval(() => {
      if (window.google && googleBtnRef.current) {
        initializeGoogleSignIn();
        clearInterval(checkGoogleInterval);
      }
    }, 100);

    return () => clearInterval(checkGoogleInterval);
  }, [text]);

  return (
    <>
      {/* Google Button Container */}
      <div ref={googleBtnRef} className="w-full flex justify-center mt-1 min-h-[44px]"></div>

      {/* Google Completing Registration Modal */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-blue-900 text-xl leading-7">Complete Registration</h3>
              <p className="text-[#71717b] text-sm leading-5">
                Welcome, {googleUser?.firstname}! Please provide your phone number and role to complete your account setup.
              </p>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5"></span>
                <span className="leading-relaxed">{modalError}</span>
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="flex flex-col gap-4">
              {/* Phone Number */}
              <div className="flex flex-col gap-2">
                <label className="font-medium text-zinc-950 text-xs leading-4" htmlFor="modalPhone">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="top-1/2 size-4 -translate-y-1/2 text-[#71717b] absolute left-3 pointer-events-none" />
                  <input
                    className="w-full border border-solid rounded-xl py-2 pl-9 pr-4 text-zinc-950 placeholder-zinc-400 outline-none focus:ring-1 text-sm transition-all border-zinc-200 focus:border-[#2b7fff] focus:ring-[#2b7fff]"
                    id="modalPhone"
                    placeholder="9876543210"
                    type="tel"
                    maxLength="10"
                    value={modalPhone}
                    onChange={(e) => setModalPhone(e.target.value)}
                    required
                  />
                </div>
              </div>



              {/* Submit Button */}
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-950 font-medium py-2.5 px-4 rounded-xl flex-1 text-sm transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="bg-[#2b7fff] hover:bg-[#1a66d9] text-blue-50 font-medium py-2.5 px-4 rounded-xl flex-1 text-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {modalLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Register</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
