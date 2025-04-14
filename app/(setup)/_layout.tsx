import { Redirect, Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Spinner, YStack } from 'tamagui';
import { RootState } from '~/redux/store';
import { getProfile } from '~/redux/thunks/profile';
import { getAccessToken, getEmailFromSecureStore } from '~/utils/token';

export default function AppLayout() {
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const dispatch = useDispatch();
  const { profile: userProfile } = useSelector((state: RootState) => state.profile);
  const [hasRegister, setHasRegister] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getAccessToken();
        setHasToken(!!token);
        const email = await getEmailFromSecureStore();
        console.log(email);
        setHasRegister(!!email);
        if (token) {
          await dispatch(getProfile() as any);
        }
      } catch (error) {
        console.error('Lỗi khi lấy data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  if (loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" space="$4">
        <Spinner size="large" color="#E94057" />
      </YStack>
    );
  }
  if (hasRegister) {
    return <Redirect href="/(auth)/otp" />;
  }

  if (!hasToken) {
    return <Redirect href="/(auth)/login" />;
  }

  if (userProfile?.isSetup) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Slot />;
}
