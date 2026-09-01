import { fetchApi } from './apiClient.js';

/**
 * Challan API operations
 */

export const challanApi = {
    // Get stats and recent donations (dashboard)
    getDashboardData: async (searchQuery = '') => {
        let endpoint = '/challan';
        if (searchQuery) {
            endpoint = `/challan/search?q=${encodeURIComponent(searchQuery)}`;
        }
        return fetchApi(endpoint);
    },

    // Get paginated history
    getHistoryData: async (page = 1, limit = 15, searchQuery = '') => {
        let endpoint = `/challan?page=${page}&limit=${limit}`;
        if (searchQuery) {
            endpoint = `/challan/search?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=${limit}`;
        }
        return fetchApi(endpoint);
    },

    // Create a new challan
    createChallan: async (data) => {
        return fetchApi('/challan', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // Delete a challan
    deleteChallan: async (id) => {
        return fetchApi(`/challan/${id}`, {
            method: 'DELETE'
        });
    }
};

export const authApi = {
    login: async (username, password) => {
        return fetchApi('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    },

    updateProfile: async (username) => {
        return fetchApi('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify({ username })
        });
    }
};
