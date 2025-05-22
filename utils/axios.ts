import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '~/config/constants';
import { ENDPOINTS } from '~/service/api.endpoint';
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from '~/utils/token';
import { getDeviceId } from './fingerprint';
class ApiClient {
  private static instance: AxiosInstance;
  private static isRefreshing = false;
  private static failedQueue: { resolve: Function; reject: Function }[] = [];

  private constructor() {}

  private static processQueue(error: any = null) {
    ApiClient.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve();
      }
    });

    ApiClient.failedQueue = [];
  }

  public static getInstance(): AxiosInstance {
    if (!ApiClient.instance) {
      ApiClient.instance = axios.create({
        baseURL: API_BASE_URL || '',
      });

      // Request interceptor
      ApiClient.instance.interceptors.request.use(
        async (config: InternalAxiosRequestConfig) => {
          const token = await getAccessToken();
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => {
          console.log(JSON.stringify(error));
          return Promise.reject(error);
        }
      );

      // Response interceptor
      ApiClient.instance.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
          const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
          };

          if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;

            if (ApiClient.isRefreshing) {
              // If refreshing token, add request to queue
              return new Promise((resolve, reject) => {
                ApiClient.failedQueue.push({ resolve, reject });
              })
                .then(async () => {
                  // When refresh is complete, retry request with new token
                  const token = await getAccessToken();
                  if (token && originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                  }
                  return ApiClient.instance(originalRequest);
                })
                .catch((err) => {
                  return Promise.reject(err);
                });
            }

            ApiClient.isRefreshing = true;

            try {
              // Lấy refresh token
              const refreshToken = await getRefreshToken();

              if (!refreshToken) {
                // Không có refresh token, từ chối request
                ApiClient.processQueue(error);
                ApiClient.isRefreshing = false;
                return Promise.reject(error);
              }
              const deviceId = await getDeviceId();
              // Tạo instance mới để tránh vòng lặp interceptor
              const refreshResponse = await axios.post(
                `${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`,
                {},
                {
                  headers: {
                    Authorization: `Bearer ${refreshToken}`,
                    'x-device-id': deviceId,
                  },
                }
              );

              if (
                refreshResponse.data &&
                refreshResponse.data.statusCode === 200 &&
                refreshResponse.data.data
              ) {
                const { access_token, refresh_token } = refreshResponse.data.data;
                await setAccessToken(access_token);
                await setRefreshToken(refresh_token);

                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${access_token}`;
                }

                ApiClient.processQueue();
                ApiClient.isRefreshing = false;

                return ApiClient.instance(originalRequest);
              } else {
                ApiClient.processQueue(error);
                ApiClient.isRefreshing = false;
                return Promise.reject(error);
              }
            } catch (refreshError: any) {
              ApiClient.processQueue(refreshError);
              ApiClient.isRefreshing = false;
              return Promise.reject(refreshError);
            }
          } else if (error.response) {
            console.error('Lỗi Response:', {
              status: error.response.status,
              data: error.response.data,
              message: error.message,
            });
          } else if (error.request) {
            console.error('Lỗi Request:', error.request);
          } else {
            console.error('Lỗi:', error.message);
          }
          return Promise.reject(error);
        }
      );
    }
    return ApiClient.instance;
  }
}

export default ApiClient;
