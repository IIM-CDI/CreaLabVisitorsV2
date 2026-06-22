import { useCallback } from 'react';

export const useApi = () => {
    const getApiUrl = useCallback(() => {
        return process.env.API_URL || 'http://localhost:8000';
    }, []);

    const getHeaders = useCallback(() => {
        const headers: Record<string, string> = { 
            "Content-Type": "application/json" 
        };
        return headers;
    }, []);

    return { getApiUrl, getHeaders };
};