import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor to handle token expiration and automatic refreshing
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // If the error response is 401 Unauthorized and we haven't retried yet
        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry &&
            // Avoid infinite loops if the refresh token endpoint itself fails with 401
            !originalRequest.url.includes('/auth/refresh')
        ) {
            originalRequest._retry = true;
            try {
                // Call the refresh endpoint to get a new access token
                await api.post('/auth/refresh');
                // Retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                // If refresh fails, clear storage and redirect to login
                localStorage.removeItem("user");
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;
