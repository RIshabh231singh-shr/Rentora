import api from "../utility/axiosInstance";

export const messageService = {
    getContacts: async () => {
        const response = await api.get("/api/messages/contacts");
        return response.data;
    },
    getMessages: async (contactId) => {
        const response = await api.get(`/api/messages/${contactId}`);
        return response.data;
    }
};
