import { useFonts } from 'expo-font';
import { Slot, SplashScreen } from 'expo-router';
import { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { TamaguiProvider } from 'tamagui';
import { useFCM } from '~/hooks/useFCM';
import { store } from '~/redux/store';
import { initializeTokenCache } from '~/utils/token';
import config from '../tamagui.config';
import { initializeSocket } from '~/redux/thunks/chat';
import { StatusBar } from 'react-native';

function AppContent() {
  const dispatch = useDispatch();
  useFCM();

  useEffect(() => {
    dispatch(initializeSocket());
    return () => {
      // Cleanup socket khi app unmount
      const { socket } = store.getState().chat;
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return <Slot />;
}

export default function Layout() {
  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });

  useEffect(() => {
    initializeTokenCache();
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <TamaguiProvider config={config}  defaultTheme="light">
      <Provider store={store}>
        <StatusBar barStyle="dark-content" />
        <AppContent />
      </Provider>
    </TamaguiProvider>
  );
}