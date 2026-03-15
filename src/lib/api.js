import axios from "axios";
import Cookies from "js-cookie";

const RAW_API_URL = "http://127.0.0.1:8000";
const API_BASE_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL}/api`;

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = Cookies.get('admin_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            Cookies.remove('admin_token');
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('admin_user');
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

// ============================================================================
// AUTHENTICATION APIs
// ============================================================================

export const authAPI = {
    login: async (email, password) => {
        const response = await apiClient.post('/auth/login', { email, password });
        const { token, user } = response.data;

        // Store token and user data
        const isSecure = process.env.NODE_ENV === 'production';
        Cookies.set('admin_token', token, { expires: 7, secure: isSecure, sameSite: 'lax' });
        sessionStorage.setItem('admin_user', JSON.stringify(user));

        return { token, user };
    },

    logout: async () => {
        try {
            await apiClient.post('/auth/logout');
        } catch (error) {
            console.error("Logout error", error);
        } finally {
            Cookies.remove('admin_token');
            sessionStorage.removeItem('admin_user');
        }
    },

    me: async () => {
        const response = await apiClient.get('/auth/me');
        return response.data;
    },

    updateProfile: async (data) => {
        const response = await apiClient.put('/auth/profile', data);
        if (response.data.user) {
            sessionStorage.setItem('admin_user', JSON.stringify(response.data.user));
        }
        return response.data;
    }
};

// ============================================================================
// PATIENT APIs
// ============================================================================

export const patientAPI = {
    list: async (params = {}) => {
        const response = await apiClient.get('/patients', { params });
        return response.data;
    },
    get: async (id) => {
        const response = await apiClient.get(`/patients/${id}`);
        return response.data;
    },
    store: async (data) => {
        const response = await apiClient.post('/patients', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await apiClient.put(`/patients/${id}`, data);
        return response.data;
    }
};

// ============================================================================
// CLINICAL APIs (Vitals, Investigations, Prescriptions)
// ============================================================================

export const visitAPI = {
    list: async (params = {}) => {
        const response = await apiClient.get('/visits', { params });
        return response.data;
    },
    store: async (data) => {
        const response = await apiClient.post('/visits', data);
        return response.data;
    }
};

export const vitalAPI = {
    list: async (visitId) => {
        const response = await apiClient.get(`/visits/${visitId}/vitals`);
        return response.data;
    },
    store: async (visitId, data) => {
        const response = await apiClient.post(`/visits/${visitId}/vitals`, data);
        return response.data;
    },
    update: async (visitId, vitalId, data) => {
        const response = await apiClient.patch(`/visits/${visitId}/vitals/${vitalId}`, { ...data, _method: 'PATCH' });
        return response.data;
    },
    listGlobal: async (params = {}) => {
        const response = await apiClient.get('/vitals', { params });
        return response.data;
    }
};

export const investigationAPI = {
    list: async (visitId) => {
        const response = await apiClient.get(`/visits/${visitId}/investigations`);
        return response.data;
    },
    store: async (visitId, data) => {
        const response = await apiClient.post(`/visits/${visitId}/investigations`, data);
        return response.data;
    },
    update: async (visitId, invId, data) => {
        const response = await apiClient.patch(`/visits/${visitId}/investigations/${invId}`, { ...data, _method: 'PATCH' });
        return response.data;
    },
    listGlobal: async (params = {}) => {
        const response = await apiClient.get('/investigations', { params });
        return response.data;
    }
};

export const prescriptionAPI = {
    list: async (visitId) => {
        const response = await apiClient.get(`/visits/${visitId}/prescriptions`);
        return response.data;
    },
    store: async (visitId, data) => {
        const response = await apiClient.post(`/visits/${visitId}/prescriptions`, data);
        return response.data;
    },
    update: async (visitId, prescriptionId, data) => {
        const response = await apiClient.patch(`/visits/${visitId}/prescriptions/${prescriptionId}`, { ...data, _method: 'PATCH' });
        return response.data;
    },
    listGlobal: async (params = {}) => {
        const response = await apiClient.get('/prescriptions', { params });
        return response.data;
    }
};

// ============================================================================
// MEDICINE & STOCK APIs
// ============================================================================

export const medicineAPI = {
    list: async (params = {}) => {
        const response = await apiClient.get('/medicines', { params });
        return response.data;
    },
    store: async (data) => {
        const response = await apiClient.post('/medicines', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await apiClient.put(`/medicines/${id}`, data);
        return response.data;
    }
};

export const stockAPI = {
    list: async (params = {}) => {
        const response = await apiClient.get('/stocks', { params });
        return response.data;
    },
    store: async (data) => {
        const response = await apiClient.post('/stocks', data);
        return response.data;
    }
};

export const billingAPI = {
    list: async (params = {}) => {
        const response = await apiClient.get('/bills', { params });
        return response.data;
    },
    get: async (id) => {
        const response = await apiClient.get(`/bills/${id}`);
        return response.data;
    },
    store: async (dataSpec) => {
        const response = await apiClient.post('/bills', dataSpec);
        return response.data;
    }
};

export const paymentAPI = {
    store: async (billId, data) => {
        const response = await apiClient.post(`/bills/${billId}/payments`, data);
        return response.data;
    },
    list: async (billId) => {
        const response = await apiClient.get(`/bills/${billId}/payments`);
        return response.data;
    }
};

export const dashboardAPI = {
    get: async () => {
        const response = await apiClient.get('/dashboard');
        return response.data;
    }
};

export default apiClient;
