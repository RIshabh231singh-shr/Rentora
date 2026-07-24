import api from "../utility/axiosInstance";

export const dashboardService = {
    getDashboardData: async () => {
        const response = await api.get("/api/dashboard");
        return response.data;
    },
    markNotificationsAsRead: async (notificationIds) => {
        const response = await api.put("/api/dashboard/notifications/mark-read", { notificationIds });
        return response.data;
    }
};
