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
  GROUP: {
    LIST: `${BASE_ENDPOINT}/group`,
    CREATE: `${BASE_ENDPOINT}/group`,
    DETAIL: (id: string) => `${BASE_ENDPOINT}/group/${id}`,
    UPDATE: (id: string) => `${BASE_ENDPOINT}/group/${id}`,
    DELETE: (id: string) => `${BASE_ENDPOINT}/group/${id}`,
    INVITE: (id: string) => `${BASE_ENDPOINT}/group/${id}/invite`,
    LEAVE: (id: string) => `${BASE_ENDPOINT}/group/${id}/leave`,
  },
  FRIEND: {
    SEARCH_BY_PHONE: (keyword: string) => `${BASE_ENDPOINT}/friend/search/${keyword}`,
    SEND_REQUEST: `${BASE_ENDPOINT}/friend`,
    RECEIVED_REQUESTS: `${BASE_ENDPOINT}/friend/requests/received`,
    SENT_REQUESTS: `${BASE_ENDPOINT}/friend/requests/sent`,
    HANDLE_REQUEST: (requestId: string) => `${BASE_ENDPOINT}/friend/requests/${requestId}`,
    LIST: `${BASE_ENDPOINT}/friend`,
    DELETE: (friendshipId: string) => `${BASE_ENDPOINT}/friend/delete/${friendshipId}`,
  },
  CHAT: {
    SEND: `${BASE_ENDPOINT}/chat/send`,
    UPLOAD_STICKER: `${BASE_ENDPOINT}/chat/sticker`,
    RECALL: (messageId: string) => `${BASE_ENDPOINT}/chat/recall/${messageId}`,
    DELETE: (messageId: string) => `${BASE_ENDPOINT}/chat/delete/${messageId}`,
    FORWARD: `${BASE_ENDPOINT}/chat/forward`,
    GET_MESSAGES: (groupId: string, limit: number = 10) => 
      `${BASE_ENDPOINT}/chat/${groupId}/messages?limit=${limit}`,
    UPLOAD_FILE: `${BASE_ENDPOINT}/chat/file`,
    UPLOAD_IMAGE: `${BASE_ENDPOINT}/chat/image`,
    MARK_AS_READ: (groupId: string) => `${BASE_ENDPOINT}/chat/${groupId}/read`,
    GET_UNREAD_COUNT: `${BASE_ENDPOINT}/chat/unread-count`,
    GET_MESSAGE: (messageId: string) => `${BASE_ENDPOINT}/chat/message/${messageId}`,
  }
};
