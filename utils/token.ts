import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const FCM_TOKEN_KEY = 'fcm_token';
const DEVICE_ID_KEY = 'device_id';
const EMAIL_KEY = 'register_email';
const REGISTER_KEY = 'register_key';

let tokenCache = {
  fcmToken: null as string | null,
  deviceId: null as string | null,
  accessToken: null as string | null,
  refreshToken: null as string | null,
  email: null as string | null,
  registerKey: null as string | null,
};

export const getDeviceIDFromSecureStore = async (): Promise<string> => {
  if (tokenCache.deviceId) return tokenCache.deviceId;

  try {
    const deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (deviceId) tokenCache.deviceId = deviceId;
    return deviceId || '';
  } catch (error) {
    console.error('Error getting device ID:', error);
    return '';
  }
};

export const setDeviceIDInSecureStore = async (device_id: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(DEVICE_ID_KEY, device_id);
    tokenCache.deviceId = device_id;
  } catch (error) {
    console.error('Error setting device ID:', error);
  }
};

// Remove device ID and clear cache
export const removeDeviceIDFromSecureStore = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
    tokenCache.deviceId = null;
  } catch (error) {
    console.error('Error removing device ID:', error);
  }
};

// Get device ID synchronously from cache
export const getCachedDeviceId = (): string => {
  return tokenCache.deviceId || '';
};

// Get FCM token with caching
export const getFcmTokenFromSecureStore = async (): Promise<string> => {
  if (tokenCache.fcmToken) return tokenCache.fcmToken;

  try {
    const token = await SecureStore.getItemAsync(FCM_TOKEN_KEY);
    if (token) tokenCache.fcmToken = token;
    return token || '';
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return '';
  }
};

// Remove FCM token and clear cache
export const removeFcmTokenFromSecureStore = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(FCM_TOKEN_KEY);
    tokenCache.fcmToken = null;
  } catch (error) {
    console.error('Error removing FCM token:', error);
  }
};

// Get FCM token synchronously from cache (will return empty if not loaded yet)
export const getCachedFcmToken = (): string => {
  return tokenCache.fcmToken || '';
};

// Save FCM token to SecureStore with cache update
export const setFcmTokenInSecureStore = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(FCM_TOKEN_KEY, token);
    tokenCache.fcmToken = token;
  } catch (error) {
    console.error('Error setting FCM token:', error);
  }
};

// Save access token with cache update
export const setAccessToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    tokenCache.accessToken = token;
  } catch (error) {
    console.error('Error setting access token:', error);
  }
};

// Get access token with cache
export const getAccessToken = async (): Promise<string | null> => {
  if (tokenCache.accessToken) return tokenCache.accessToken;
  try {
    const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    if (token) tokenCache.accessToken = token;
    return token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

// Remove access token and clear cache
export const removeAccessToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    tokenCache.accessToken = null;
  } catch (error) {
    console.error('Error removing access token:', error);
  }
};

// Save refresh token with cache update
export const setRefreshToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    tokenCache.refreshToken = token;
  } catch (error) {
    console.error('Error setting refresh token:', error);
  }
};

// Get refresh token with cache
export const getRefreshToken = async (): Promise<string | null> => {
  if (tokenCache.refreshToken) return tokenCache.refreshToken;

  try {
    const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (token) tokenCache.refreshToken = token;
    return token;
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

// Remove refresh token and clear cache
export const removeRefreshToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    tokenCache.refreshToken = null;
  } catch (error) {
    console.error('Error removing refresh token:', error);
  }
};

// Save email with cache update
export const setEmailInSecureStore = async (email: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(EMAIL_KEY, email);
    tokenCache.email = email;
  } catch (error) {
    console.error('Error setting email:', error);
  }
};

// Get email with cache
export const getEmailFromSecureStore = async (): Promise<string | null> => {
  if (tokenCache.email) return tokenCache.email;

  try {
    const email = await SecureStore.getItemAsync(EMAIL_KEY);
    if (email) tokenCache.email = email;
    return email;
  } catch (error) {
    console.error('Error getting email:', error);
    return null;
  }
};

// Remove email and clear cache
export const removeEmailFromSecureStore = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(EMAIL_KEY);
    tokenCache.email = null;
  } catch (error) {
    console.error('Error removing email:', error);
  }
};

// Save register key with cache update
export const setRegisterKeyInSecureStore = async (key: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(REGISTER_KEY, key);
    tokenCache.registerKey = key;
  } catch (error) {
    console.error('Error setting register key:', error);
  }
};

export const getRegisterKeyFromSecureStore = async (): Promise<string | null> => {
  if (tokenCache.registerKey) return tokenCache.registerKey;

  try {
    const key = await SecureStore.getItemAsync(REGISTER_KEY);
    if (key) tokenCache.registerKey = key;
    return key;
  } catch (error) {
    console.error('Error getting register key:', error);
    return null;
  }
};

export const removeRegisterKeyFromSecureStore = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(REGISTER_KEY);
    tokenCache.registerKey = null;
  } catch (error) {
    console.error('Error removing register key:', error);
  }
};

export const hasToken = async (): Promise<boolean> => {
  const token = await getAccessToken();
  return !!token;
};

export const clearTokens = async (): Promise<void> => {
  await removeAccessToken();
  await removeRefreshToken();
  await removeFcmTokenFromSecureStore();
  await removeDeviceIDFromSecureStore();
  tokenCache.accessToken = null;
  tokenCache.refreshToken = null;
  tokenCache.fcmToken = null;
  tokenCache.deviceId = null;
};

export const clearRegistrationData = async (): Promise<void> => {
  await removeEmailFromSecureStore();
  await removeRegisterKeyFromSecureStore();
  tokenCache.email = null;
  tokenCache.registerKey = null;
};

export const initializeTokenCache = async (): Promise<void> => {
  await getFcmTokenFromSecureStore();
  await getDeviceIDFromSecureStore();
  await getAccessToken();
  await getRefreshToken();
  await getEmailFromSecureStore();
  await getRegisterKeyFromSecureStore();
};
