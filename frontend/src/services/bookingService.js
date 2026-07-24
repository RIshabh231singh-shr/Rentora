import api from "../utility/axiosInstance";

export const bookingService = {
    bookAmenity: async (data) => {
        const response = await api.post("/api/bookings/book", data);
        return response.data;
    },
    bookProperty: async (data) => {
        const response = await api.post("/api/bookings/property/book", data);
        return response.data;
    },
    getMyBookings: async (params = {}) => {
        const response = await api.get("/api/bookings/my", { params });
        return response.data;
    },
    getBookingById: async (id) => {
        const response = await api.get(`/api/bookings/${id}`);
        return response.data;
    },
    checkIn: async (id) => {
        const response = await api.post(`/api/bookings/${id}/checkin`);
        return response.data;
    },
    checkOut: async (id) => {
        const response = await api.post(`/api/bookings/${id}/checkout`);
        return response.data;
    },
    cancelBooking: async (id) => {
        const response = await api.delete(`/api/bookings/${id}`);
        return response.data;
    },
    getSlotAvailability: async (amenityId, date) => {
        const response = await api.get(`/api/bookings/amenity/${amenityId}/availability`, { params: { date } });
        return response.data;
    },
    getPropertySlotAvailability: async (propertyId, date) => {
        const response = await api.get(`/api/bookings/property/${propertyId}/availability`, { params: { date } });
        return response.data;
    },
    approveBooking: async (id) => {
        const response = await api.put(`/api/bookings/${id}/approve`);
        return response.data;
    },
    rejectBooking: async (id) => {
        const response = await api.put(`/api/bookings/${id}/reject`);
        return response.data;
    },
    approveCancellation: async (id) => {
        const response = await api.put(`/api/bookings/${id}/approve-cancellation`);
        return response.data;
    },
    rejectCancellation: async (id) => {
        const response = await api.put(`/api/bookings/${id}/reject-cancellation`);
        return response.data;
    }
};
