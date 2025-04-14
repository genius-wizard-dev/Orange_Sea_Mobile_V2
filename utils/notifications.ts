import { Alert, Platform } from 'react-native';

export const showNotification = (title: string, message: string) => {
  console.log(`Notification: ${title} - ${message}`);

  Alert.alert(title, message);
};

export const handleFCMNotification = (notification: any) => {
  if (!notification) return;

  const title = notification.title || 'Notification';
  const body = notification.body || '';

  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    showNotification(title, body);
  } else {
    console.log(`Notification: ${title} - ${body}`);
  }
};
