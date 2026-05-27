import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "sonner";

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
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
        const status = error.response?.status;
        const message = error.response?.data?.error || error.response?.data?.message || error.message || "An unexpected error occurred";

        if (status === 401) {
            // Token expired or invalid
            Cookies.remove('admin_token');
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('admin_user');
                if (!window.location.pathname.includes('/login')) {
                    toast.error("Session expired. Please login again.");
                    window.location.href = '/login';
                }
            }
        } else if (status === 422) {
            // Validation errors
            const errors = error.response.data.errors;
            if (errors) {
                const firstError = Object.values(errors)[0][0];
                toast.error(firstError);
            } else {
                toast.error(message);
            }
        } else if (status >= 500) {
            toast.error("Server error. Please try again later.");
        } else if (error.code === 'ERR_NETWORK') {
            toast.error("Network error. Please check your connection.");
        } else {
            toast.error(message);
        }

        return Promise.reject(error);
    }
);

// ============================================================================
// AUTHENTICATION APIs
// ============================================================================

export const authAPI = {
    login: async (email, password, remember = false) => {
        const response = await apiClient.post('/auth/login', { email, password });
        const { token, user } = response.data;

        // Store token and user data
        const isSecure = process.env.NODE_ENV === 'production';
        const cookieOptions = { secure: isSecure, sameSite: 'lax' };

        if (remember) {
            cookieOptions.expires = 14; // 14 days
            localStorage.setItem('admin_user', JSON.stringify(user));
            localStorage.setItem('admin_remember', 'true');
        } else {
            sessionStorage.setItem('admin_user', JSON.stringify(user));
            localStorage.removeItem('admin_remember');
        }

        Cookies.set('admin_token', token, cookieOptions);

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
            localStorage.removeItem('admin_user');
            localStorage.removeItem('admin_remember');
        }
    },

    me: async () => {
        const response = await apiClient.get('/auth/me');
        return response.data;
    },

    updateProfile: async (data) => {
        const response = await apiClient.put('/auth/profile', data);
        if (response.data.user) {
            const isRemembered = localStorage.getItem('admin_remember') === 'true';
            if (isRemembered) {
                localStorage.setItem('admin_user', JSON.stringify(response.data.user));
            } else {
                sessionStorage.setItem('admin_user', JSON.stringify(response.data.user));
            }
        }
        return response.data;
    },

    forgotPassword: async (email) => {
        const response = await apiClient.post('/auth/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (data) => {
        const response = await apiClient.post('/auth/reset-password', data);
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
    get: async (id, params = {}) => {
        const response = await apiClient.get(`/patients/${id}`, { params });
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
    },
    update: async (id, data) => {
        const response = await apiClient.put(`/visits/${id}`, data);
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

export const consultationAPI = {
    list: async (visitId) => {
        const response = await apiClient.get(`/visits/${visitId}/consultations`);
        return response.data;
    },
    store: async (visitId, data) => {
        const response = await apiClient.post(`/visits/${visitId}/consultations`, data);
        return response.data;
    },
    update: async (visitId, id, data) => {
        const response = await apiClient.patch(`/visits/${visitId}/consultations/${id}`, data);
        return response.data;
    },
    listGlobal: async (params = {}) => {
        const response = await apiClient.get('/consultations', { params });
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
    },
    storeStandalone: async (data) => {
        const response = await apiClient.post('/investigations/standalone', data);
        return response.data;
    },
    updateStandalone: async (id, data) => {
        const response = await apiClient.patch(`/investigations/standalone/${id}`, data);
        return response.data;
    },
    get: async (id) => {
        const response = await apiClient.get(`/investigations/${id}`);
        return response.data;
    }
};

export const labTestAPI = {
    list: async (params = {}) => {
        const response = await apiClient.get('/lab-tests', { params });
        return response.data;
    },
    store: async (data) => {
        const response = await apiClient.post('/lab-tests', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await apiClient.put(`/lab-tests/${id}`, data);
        return response.data;
    },
    bulkStore: async (data) => {
        const response = await apiClient.post('/lab-tests/bulk', data);
        return response.data;
    },
    delete: async (id) => {
        const response = await apiClient.delete(`/lab-tests/${id}`);
        return response.data;
    }
};

export const salesAPI = {
    report: async (params) => {
        const response = await apiClient.get('/sales/report', { params });
        return response.data;
    },
    dailyDetails: async (date) => {
        const response = await apiClient.get('/sales/daily-details', { params: { date } });
        return response.data;
    }
};

export const adminAPI = {
    getAdmins: async (params = {}) => {
        const response = await apiClient.get('/admins', { params });
        return response.data;
    },
    createAdmin: async (data) => {
        const response = await apiClient.post('/admins', data);
        return response.data;
    },
    toggleStatus: async (id) => {
        const response = await apiClient.post(`/admins/${id}/toggle-status`);
        return response.data;
    },
};

export const activityLogAPI = {
    getLogs: async (params) => {
        const searchParams = new URLSearchParams(params).toString();
        const response = await apiClient.get(`/activity-logs?${searchParams}`);
        return response.data;
    },
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
    update: async (visitId, id, data) => {
        const response = await apiClient.patch(`/visits/${visitId}/prescriptions/${id}`, data);
        return response.data;
    },
    delete: async (visitId, id) => {
        const response = await apiClient.delete(`/visits/${visitId}/prescriptions/${id}`);
        return response.data;
    },
    listGlobal: async (params = {}) => {
        const response = await apiClient.get('/prescriptions', { params });
        return response.data;
    },
    deleteGlobal: async (id) => {
        const response = await apiClient.delete(`/prescriptions/${id}`);
        return response.data;
    },
    storeStandalone: async (data) => {
        const response = await apiClient.post('/prescriptions/standalone', data);
        return response.data;
    },
    updateStandalone: async (id, data) => {
        const response = await apiClient.patch(`/prescriptions/standalone/${id}`, data);
        return response.data;
    },
    get: async (id) => {
        const response = await apiClient.get(`/prescriptions/${id}`);
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
    },
    updateCategory: async (old_name, new_name) => {
        const response = await apiClient.post('/medicines/category/update', { old_name, new_name });
        return response.data;
    },
    deleteCategory: async (name) => {
        const response = await apiClient.post('/medicines/category/delete', { name });
        return response.data;
    },
    categories: async () => {
        const response = await apiClient.get('/medicines/categories');
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
    },
    adjust: async (id, adjustment) => {
        const response = await apiClient.patch(`/stocks/${id}/adjust`, { adjustment });
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
    },
    payVisit: async (visitId, data) => {
        const response = await apiClient.post(`/visits/${visitId}/payments`, data);
        return response.data;
    }
};

export const dashboardAPI = {
    get: async () => {
        const response = await apiClient.get('/dashboard');
        return response.data;
    }
};

export const settingsAPI = {
    get: async () => {
        const response = await apiClient.get('/settings');
        return response.data;
    },
    update: async (data) => {
        const response = await apiClient.put('/settings', data);
        return response.data;
    }
};

export default apiClient;
