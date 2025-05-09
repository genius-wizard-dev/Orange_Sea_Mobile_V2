import { getApp } from '@react-native-firebase/app';
import  {
  getToken as getFCMToken,
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';

import { AuthorizationStatus } from '@react-native-firebase/messaging';

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
    console.log("useFCM ");
    try {
      const storedToken = await getFcmTokenFromSecureStore();
      if (storedToken) {
        // console.log("fcm o duoi ");
        console.log("fcm token :", fcmToken);
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
      const authStatus = await messaging.requestPermission(); // Truy cập trực tiếp vào messaging
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL; // Kiểm tra với AuthorizationStatus

      console.log('Authorization status:', authStatus, 'Enabled:', enabled);
      return enabled;
    } catch (error) {
      console.log('Permission request error:', error);
      return false;
    }
  };

  useEffect(() => {
    const initializeFCM = async () => {
      const existingToken = await getFcmTokenFromSecureStore();
      console.log('existingToken:', existingToken);

      const hasPermission = await requestUserPermission();
      console.log('hasPermission noti :', hasPermission);

      if (hasPermission && !existingToken) {
        // console.log('Calling getToken() now...');
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
