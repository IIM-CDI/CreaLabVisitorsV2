import { useCallback } from 'react';

export const useApi = () => {
    const getApiUrl = useCallback(() => {
        return process.env.API_URL || 'http://localhost:8000';
    }, []);

    const getHeaders = useCallback(() => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        };
        return headers;
    }, []);

    return { getApiUrl, getHeaders };
};
