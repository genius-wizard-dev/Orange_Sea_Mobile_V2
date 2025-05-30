import { useFonts } from 'expo-font';
import { Slot, SplashScreen, router } from 'expo-router';
import { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
// Thêm các import cần thiết và kiểm tra cách import từ tamagui
import { TamaguiProvider, YStack, Text, Button } from 'tamagui';
// Import Modal riêng để đảm bảo nó tồn tại
import { Modal } from 'tamagui'; // Hoặc 'react-native' nếu sử dụng Modal của React Native
import { useFCM } from '~/hooks/useFCM';
import { store } from '~/redux/store';
import { initializeTokenCache, removeAccessToken, removeRefreshToken } from '~/utils/token';
import config from '../tamagui.config';
import { initializeSocket } from '~/redux/thunks/chat';
import { StatusBar } from 'react-native';
import { logout } from '~/service/auth.service';
import { hidePasswordUpdatedModal } from '~/redux/slices/profile';

// Component này bên trong Provider, nên có thể sử dụng Redux hooks
function AppContent() {
  const dispatch = useDispatch();
  const showModal = useSelector(state => state.profile.showPasswordUpdatedModal);
  useFCM();

  // Chuyển hàm performLogout vào đây
  const performLogout = async () => {
    try {
      await logout();
      await removeAccessToken();
      await removeRefreshToken();
      router.replace('/');
    } catch (error) {
      console.error('Logout failed:', error);
      await removeAccessToken();
      await removeRefreshToken();
      router.replace('/');
    }
  };

  useEffect(() => {
    dispatch(initializeSocket());
    return () => {
      const { socket } = store.getState().chat;
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return (
    <>
      <Slot />

      {/* Sử dụng Modal từ React Native nếu Modal của Tamagui không hoạt động */}
      {showModal && (
        <YStack
          position="absolute"
          top={0}
          bottom={0}
          left={0}
          right={0}
          backgroundColor="rgba(0, 0, 0, 0.5)"
          justifyContent="center"
          alignItems="center"
          padding={16}
          zIndex={1000}
        >
          <YStack
            backgroundColor="white"
            borderRadius={12}
            padding={20}
            width="90%"
            maxWidth={400}
            space={16}
            alignItems="center"
          >
            <Text fontSize={18} fontWeight="bold" textAlign="center">
              Mật khẩu đã được cập nhật
            </Text>
            <Text fontSize={16} color="$gray11" textAlign="center">
              Tài khoản của bạn đã được cập nhật mật khẩu.
              Vui lòng đăng nhập lại với mật khẩu mới.
            </Text>
            <Button
              backgroundColor="#FF7A1E"
              color="white"
              onPress={async () => {
                await performLogout();
                dispatch(hidePasswordUpdatedModal());
              }}
              width="100%"
              marginTop={10}
            >
              Đăng nhập lại
            </Button>
          </YStack>
        </YStack>
      )}
    </>
  );
}

// Layout không sử dụng Redux hooks nữa
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
    <TamaguiProvider config={config} defaultTheme="light">
      <Provider store={store}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#FF7A1E"
          translucent={false}
        />
        <AppContent />
      </Provider>
    </TamaguiProvider>
  );
}