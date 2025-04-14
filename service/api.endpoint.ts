const BASE_ENDPOINT = '/api';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${BASE_ENDPOINT}/auth/login`,
    REGISTER: `${BASE_ENDPOINT}/auth/register`,
    REFRESH: `${BASE_ENDPOINT}/auth/refresh`,
    LOGOUT: `${BASE_ENDPOINT}/auth/logout`,
    IS_REGISTER: `${BASE_ENDPOINT}/auth/is-register`,
    VERIFY_OTP: `${BASE_ENDPOINT}/auth/verify-otp`,
    FORGOT: `${BASE_ENDPOINT}/auth/forgot-password`,
    RESET: `${BASE_ENDPOINT}/auth/reset-password`,
    RESEND_OTP: `${BASE_ENDPOINT}/auth/resend-otp`,
  },
  PROFILE: {
    ME: `${BASE_ENDPOINT}/profile/me`,
    INFO: (id: string) => `${BASE_ENDPOINT}/profile/${id}`,
  },
  ACCOUNT: {
    INFO: (id: string) => `${BASE_ENDPOINT}/account/${id}`,
    GET_BY_USERNAME: (username: string) => `${BASE_ENDPOINT}/account/username/${username}`,
    PASSWORD: (id: string) => `${BASE_ENDPOINT}/account/${id}/password`,
  },
};
