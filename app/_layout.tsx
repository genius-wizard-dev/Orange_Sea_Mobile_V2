import { useFonts } from 'expo-font';
import { Slot, SplashScreen } from 'expo-router';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { TamaguiProvider } from 'tamagui';
import { useFCM } from '~/hooks/useFCM';
import { store } from '~/redux/store';
import { initializeTokenCache } from '~/utils/token';
import config from '../tamagui.config';

export default function Layout() {
  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });
  const { fcmToken } = useFCM();
  console.log(fcmToken);
  useEffect(() => {
    initializeTokenCache();
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <TamaguiProvider config={config}>
      <Provider store={store}>
        <Slot />
      </Provider>
    </TamaguiProvider>
  );
}
