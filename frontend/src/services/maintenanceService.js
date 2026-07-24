import api from "../utility/axiosInstance";

export const maintenanceService = {
    getKPIs: async () => {
        const response = await api.get("/api/maintenance/kpi");
        return response.data;
    },
    getRequests: async () => {
        const response = await api.get("/api/maintenance");
        return response.data;
    },
    createRequest: async (formData) => {
        const response = await api.post("/api/maintenance", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data;
    },
    updateRequestStatus: async (id, status) => {
        const response = await api.put(`/api/maintenance/${id}/status`, { status });
        return response.data;
    },
    assignStaff: async (id, assignedStaff) => {
        const response = await api.put(`/api/maintenance/${id}/assign`, { assignedStaff });
        return response.data;
    },
    submitReview: async (id, reviewData) => {
        const response = await api.post(`/api/maintenance/${id}/review`, reviewData);
        return response.data;
    }
};
