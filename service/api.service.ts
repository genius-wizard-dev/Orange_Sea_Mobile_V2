import { ApiService } from '~/types/api.service';
import ApiClient from '~/utils/axios';
import { getDeviceId } from '~/utils/fingerprint';
import { getFcmTokenFromSecureStore } from '~/utils/token';

// Get the preconfigured axios instance
const axiosInstance = ApiClient.getInstance();

class ApiServiceImpl implements ApiService {
  private async request<T>(
    method: string,
    uri: string,
    data?: object | FormData,
    contentType?: string
  ): Promise<T> {
    try {
      console.log(`📤 Making ${method} request to ${uri}`, { data });
      console.log(typeof data);
      // const accessToken = getAccessToken
      let headers: Record<string, string> = {};

      const deviceId = await getDeviceId();
      console.log(deviceId);
      const fcmToken = await getFcmTokenFromSecureStore();

      headers = {
        'X-Device-ID': deviceId,
        'X-FCM-Token': fcmToken,
      };

      if (contentType) {
        headers['Content-Type'] = contentType;
      } else if (data instanceof FormData) {
        headers['Content-Type'] = 'multipart/form-data';
      } else if (data && typeof data === 'object') {
        headers['Content-Type'] = 'application/json';
      }

      const response = await axiosInstance.request<T>({
        method,
        url: uri,
        data,
        headers,
      });

      return response.data;
    } catch (error: any) {
      console.dir(error);
      // console.error(`❌ Error in ${method} request to ${uri}:`, error);
      throw error;
    }
  }

  async get<T>(uri: string, contentType?: string): Promise<T> {
    return this.request<T>('GET', uri, undefined, contentType);
  }

  async post<T>(uri: string, data?: object | FormData, contentType?: string): Promise<T> {
    return this.request<T>('POST', uri, data, contentType);
  }

  async put<T>(uri: string, data?: object | FormData, contentType?: string): Promise<T> {
    return this.request<T>('PUT', uri, data, contentType);
  }

  async delete<T>(uri: string, data?: any ,contentType?: string): Promise<T> {
    return this.request<T>('DELETE', uri, data, contentType);
  }
}

const apiService = new ApiServiceImpl();

export default apiService;
