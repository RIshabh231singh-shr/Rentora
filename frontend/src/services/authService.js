import api from "../utility/axiosInstance";

export const authService = {
    login: async (credentials) => {
        const response = await api.post("/api/auth/login", credentials);
        return response.data;
    },
    register: async (userData) => {
        const response = await api.post("/api/auth/register", userData);
        return response.data;
    },
    logout: async () => {
        const response = await api.post("/api/auth/logout");
        return response.data;
    },
    verifyOtp: async (data) => {
        const response = await api.post("/api/auth/verify-otp", data);
        return response.data;
    },
    resendOtp: async (data) => {
        const response = await api.post("/api/auth/resend-otp", data);
        return response.data;
    },
    forgotPassword: async (data) => {
        const response = await api.post("/api/auth/forgot-password", data);
        return response.data;
    },
    resetPassword: async (data) => {
        const response = await api.post("/api/auth/reset-password", data);
        return response.data;
    },
    googleLogin: async (data) => {
        const response = await api.post("/api/auth/google-login", data);
        return response.data;
    },
    googleRegister: async (data) => {
        const response = await api.post("/api/auth/google-register", data);
        return response.data;
    },
    updateProfile: async (data) => {
        const response = await api.patch("/api/auth/profile", data);
        return response.data;
    },
    changePassword: async (data) => {
        const response = await api.patch("/api/auth/change-password", data);
        return response.data;
    }
};
