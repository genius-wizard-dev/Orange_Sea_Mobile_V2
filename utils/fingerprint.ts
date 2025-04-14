import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import {
  getCachedDeviceId,
  getDeviceIDFromSecureStore,
  removeDeviceIDFromSecureStore,
  setDeviceIDInSecureStore,
} from './token';

const generateDeviceHexId = async (): Promise<string> => {
  const deviceInfo = [
    Platform.OS,
    Device.brand,
    Device.modelName,
    await getBaseDeviceId(),
    Device.osName,
    Device.osVersion,
    Application.applicationName,
  ]
    .filter(Boolean)
    .join('|');

  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, deviceInfo);

  return hash.substring(0, 16);
};

const getBaseDeviceId = async (): Promise<string> => {
  if (Platform.OS === 'android') {
    return Application.getAndroidId() || '';
  }

  if (Platform.OS === 'ios') {
    try {
      return (await Application.getIosIdForVendorAsync()) || '';
    } catch {
      return '';
    }
  }

  return '';
};

// Fallback để tạo ID ngẫu nhiên nếu không lấy được thông tin thiết bị
const generateRandomHexId = async (): Promise<string> => {
  const randomBytes = Math.random().toString() + Date.now().toString();
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, randomBytes);
  return hash.substring(0, 16);
};

export const getDeviceId = async (): Promise<string> => {
  try {
    const cachedId = getCachedDeviceId();
    if (cachedId) return cachedId;

    const secureStoreId = await getDeviceIDFromSecureStore();
    if (secureStoreId) return secureStoreId;

    const id = await generateDeviceHexId();

    await setDeviceIDInSecureStore(id);

    return id;
  } catch (error) {
    console.error('Error getting device ID:', error);
    const randomId = await generateRandomHexId();

    try {
      await setDeviceIDInSecureStore(randomId);
    } catch {
      console.log('Create DeviceID Fail');
    }
    return randomId;
  }
};

export const clearDeviceId = async (): Promise<void> => {
  try {
    await removeDeviceIDFromSecureStore();
  } catch (error) {
    console.error('Error clearing device ID:', error);
  }
};
