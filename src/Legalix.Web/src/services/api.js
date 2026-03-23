import axios from 'axios';

const api = axios.create({
    baseURL: '/api'
});

// We'll store the current tenant ID in a module-level variable
// so it can be updated by AuthContext but accessed by the interceptor.
let dynamicTenantId = null;

export const setApiTenantId = (tenantId) => {
    dynamicTenantId = tenantId;
};

api.interceptors.request.use((config) => {
    const savedUser = localStorage.getItem('user');
    let tenantId = null;

    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            if (user.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
            // Check both PascalCase and camelCase
            tenantId = user.companyId || user.CompanyId;
        } catch (e) {
            console.error("Error parsing user from localStorage", e);
        }
    }

    // Also look for an explicitly selected tenant in localStorage
    const selectedTenantId = localStorage.getItem('selectedTenantId');

    // Priority: dynamic (from switcher) > selected (from storage) > user profile
    const finalTenantId = dynamicTenantId || selectedTenantId || tenantId;
    
    if (finalTenantId) {
        config.headers['X-Tenant-Id'] = finalTenantId;
    }

    // Cache-busting for GET requests
    if (config.method === 'get') {
        config.params = {
            ...config.params,
            _t: new Date().getTime()
        };
    }

    return config;
});

export default api;
