import { API_URL } from '../config.js';
import { getAuthHeaders } from '../auth/auth.js';

/**
 * Core API Client
 * Centralizes the fetch logic, JSON parsing, error handling and auth headers.
 */
export async function fetchApi(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
    
    const defaultHeaders = {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };

    // If FormData is passed, we shouldn't set Content-Type to application/json manually
    if (options.body instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    try {
        const response = await fetch(url, config);
        
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('adminUsername');
            window.location.href = 'login.html';
            return;
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await response.json();
            return data;
        } else {
            // Not JSON, likely an HTML error page (like 404 Not Found)
            throw new Error(`API Error: Received non-JSON response with status ${response.status}`);
        }
    } catch (error) {
        console.error(`API Error on ${endpoint}:`, error);
        throw error;
    }
}
