import Constants from 'expo-constants';

export const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? 'http://192.168.20.112:8000'; // Sửa port thành 8000 nếu server socket chạy ở port 8000
