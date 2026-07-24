import api from "../utility/axiosInstance";

export const amenityService = {
    getAmenities: async (params = {}) => {
        const response = await api.get("/api/amenities", { params });
        return response.data;
    },
    getAmenityById: async (id) => {
        const response = await api.get(`/api/amenities/${id}`);
        return response.data;
    },
    createAmenity: async (data) => {
        const response = await api.post("/api/amenities", data);
        return response.data;
    },
    updateAmenity: async (id, data) => {
        const response = await api.patch(`/api/amenities/${id}`, data);
        return response.data;
    },
    deleteAmenity: async (id) => {
        const response = await api.delete(`/api/amenities/${id}`);
        return response.data;
    }
};
