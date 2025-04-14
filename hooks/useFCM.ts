import { getApp } from '@react-native-firebase/app';
import {
  getToken as getFCMToken,
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import { useEffect, useState } from 'react';
import { PermissionsAndroid } from 'react-native';
import { handleFCMNotification } from '~/utils/notifications';
import {
  getCachedFcmToken,
  getFcmTokenFromSecureStore,
  setFcmTokenInSecureStore,
} from '~/utils/token';

export const useFCM = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(getCachedFcmToken() || null);
  const messaging = getMessaging(getApp());

  const getToken = async () => {
    try {
      const storedToken = await getFcmTokenFromSecureStore();
      if (storedToken) {
        console.log(fcmToken);
        setFcmToken(storedToken);
        return storedToken;
      }
      const token = await getFCMToken(messaging);
      setFcmToken(token);
      await setFcmTokenInSecureStore(token);
      return token;
    } catch (error) {
      console.log('Error getting FCM token:', error);
      return null;
    }
  };

  const requestUserPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.log('Permission request error:', error);
      return false;
    }
  };

  useEffect(() => {
    const initializeFCM = async () => {
      const existingToken = await getFcmTokenFromSecureStore();
      if (existingToken) {
        setFcmToken(existingToken);
      }

      const hasPermission = await requestUserPermission();
      if (hasPermission && !existingToken) {
        await getToken();
      }
    };

    initializeFCM();

    getInitialNotification(messaging).then((remoteMessage) => {
      if (remoteMessage) {
        console.log('Notification caused app to open from quit state:', remoteMessage.notification);
        handleFCMNotification(remoteMessage.notification);
      }
    });

    const unsubscribeNotificationOpenedApp = onNotificationOpenedApp(messaging, (remoteMessage) => {
      console.log(
        'Notification caused app to open from background state:',
        remoteMessage.notification
      );
      handleFCMNotification(remoteMessage.notification);
    });

    setBackgroundMessageHandler(messaging, async (remoteMessage) => {
      console.log('Message handled in the background:', remoteMessage);
    });

    const unsubscribeOnMessage = onMessage(messaging, async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);
      handleFCMNotification(remoteMessage.notification);
    });

    return () => {
      unsubscribeNotificationOpenedApp();
      unsubscribeOnMessage();
    };
  }, [messaging]);

  return {
    fcmToken,
    getToken,
    requestUserPermission,
  };
};
