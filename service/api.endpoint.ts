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
    PASSWORD: `${BASE_ENDPOINT}/account/password`,
  },
  GROUP: {
    LIST: `${BASE_ENDPOINT}/group`,
    CREATE: `${BASE_ENDPOINT}/group`,
    DETAIL: (id: string) => `${BASE_ENDPOINT}/group/${id}`,
    SEARCH: (keyword: string) => `${BASE_ENDPOINT}/group/search/${keyword}`,
    ADD_PARTICIPANT: (groupId: string) => `${BASE_ENDPOINT}/group/${groupId}/participant`,
    REMOVE_PARTICIPANT: (groupId: string) => `${BASE_ENDPOINT}/group/${groupId}/participant`,
    DELETE: (groupId: string) => `${BASE_ENDPOINT}/group/${groupId}`,
    LEAVE: (groupId: string) => `${BASE_ENDPOINT}/group/${groupId}/leave`,
    TRANSFER_OWNER: (groupId: string) => `${BASE_ENDPOINT}/group/${groupId}/owner`,
    RENAME: (groupId: string) => `${BASE_ENDPOINT}/group/${groupId}/rename`,
  },
  FRIEND: {
    SEARCH_BY_PHONE: (keyword: string) => `${BASE_ENDPOINT}/friend/search/${keyword}`,
    SEND_REQUEST: `${BASE_ENDPOINT}/friend`,
    LIST_RECEIVED_REQUESTS: `${BASE_ENDPOINT}/friend/requests/received`,
    LIST_SENT_REQUESTS: `${BASE_ENDPOINT}/friend/requests/sent`,
    HANDLE_REQUEST: (requestId: string) => `${BASE_ENDPOINT}/friend/requests/${requestId}`,
    LIST: `${BASE_ENDPOINT}/friend`,
    DELETE: (friendshipId: string) => `${BASE_ENDPOINT}/friend/delete/${friendshipId}`,
    CHECK_FRIENDSHIP: (profileId: string) => `${BASE_ENDPOINT}/friend/check/${profileId}`,
  },
  CHAT: {
    SEND: `${BASE_ENDPOINT}/chat/send`,
    UPLOAD_STICKER: `${BASE_ENDPOINT}/chat/sticker`,
    RECALL: (messageId: string) => `${BASE_ENDPOINT}/chat/recall/${messageId}`,
    DELETE: (messageId: string) => `${BASE_ENDPOINT}/chat/delete/${messageId}`,
    FORWARD: `${BASE_ENDPOINT}/chat/forward`,
    GET_MESSAGES: (groupId: String) => `${BASE_ENDPOINT}/chat/messages/${groupId}`,
    EDIT_MESSAGE: (messageId: String) => `${BASE_ENDPOINT}/chat/edit/${messageId}`,
    GET_MEDIA: (groupId: String) => `${BASE_ENDPOINT}/chat/media/${groupId}`,
  }
};
