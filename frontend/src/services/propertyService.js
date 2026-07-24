import api from "../utility/axiosInstance";

export const propertyService = {
    getAllProperties: async (params = {}) => {
        const response = await api.get("/api/properties", { params });
        return response.data;
    },
    getPropertyById: async (id) => {
        const response = await api.get(`/api/properties/${id}`);
        return response.data;
    },
    createProperty: async (formData) => {
        const response = await api.post("/api/properties", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data;
    },
    updateProperty: async (id, data) => {
        const response = await api.patch(`/api/properties/${id}`, data);
        return response.data;
    },
    deleteProperty: async (id) => {
        const response = await api.delete(`/api/properties/${id}`);
        return response.data;
    },
    addTenant: async (propertyId, data) => {
        const response = await api.post(`/api/properties/${propertyId}/tenants`, data);
        return response.data;
    },
    removeTenant: async (propertyId, tenantId) => {
        const response = await api.delete(`/api/properties/${propertyId}/tenants/${tenantId}`);
        return response.data;
    },
    getTenantsOfProperty: async (propertyId) => {
        const response = await api.get(`/api/properties/${propertyId}/tenants`);
        return response.data;
    },
    getPendingTenantRequests: async (params = {}) => {
        const response = await api.get("/api/properties/pending-requests", { params });
        return response.data;
    },
    acceptTenantRequest: async (propertyId, tenantId) => {
        const response = await api.post(`/api/properties/${propertyId}/tenants/${tenantId}/accept`);
        return response.data;
    },
    rejectTenantRequest: async (propertyId, tenantId) => {
        const response = await api.post(`/api/properties/${propertyId}/tenants/${tenantId}/reject`);
        return response.data;
    }
};
