import api from "../utility/axiosInstance";

export const userService = {
    getUsers: async () => {
        const response = await api.get("/api/users");
        return response.data;
    },
    requestRoleChange: async (requestedRole, reason) => {
        const response = await api.post("/api/users/request-role", { requestedRole, reason });
        return response.data;
    },
    approveRoleRequest: async (userId) => {
        const response = await api.post(`/api/users/role-request/${userId}/approve`);
        return response.data;
    },
    rejectRoleRequest: async (userId) => {
        const response = await api.post(`/api/users/role-request/${userId}/reject`);
        return response.data;
    },
    uploadProfilePicture: async (formData) => {
        const response = await api.post("/api/users/profile-picture", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data;
    },
    updateUserRole: async (userId, role) => {
        const response = await api.put(`/api/users/${userId}/role`, { role });
        return response.data;
    }
};
