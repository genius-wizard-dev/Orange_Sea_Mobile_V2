import axios from 'axios';
import { ENDPOINTS } from './api.endpoint';
import { getAccessToken } from '~/utils/token';
import apiService from './api.service';

export const logout = async () => {
    try {
        const response = await apiService.post(
            ENDPOINTS.AUTH.LOGOUT,
            {}
        );
        return response;
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
};