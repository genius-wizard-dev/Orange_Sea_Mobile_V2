import { AxiosResponse } from "axios";

export interface ApiService {
  get<T>(uri: string, token?: string, params?: any): Promise<AxiosResponse<T>>;
  post<T>(uri: string, data?: any, token?: string): Promise<AxiosResponse<T>>;
  put<T>(uri: string, data?: any, token?: string): Promise<AxiosResponse<T>>;
  delete<T>(uri: string, data?: any, token?: string): Promise<AxiosResponse<T>>;
}
