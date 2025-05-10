import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, H2, Image, Input, Spinner, Text, XStack, YStack } from 'tamagui';
import { ENDPOINTS } from '~/service/api.endpoint';
import apiService from '~/service/api.service';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleResetPassword = async () => {
    try {
      setIsLoading(true);
      const res = await apiService.post<{ status: number }>(ENDPOINTS.AUTH.FORGOT, { email });

      if (res.status === 200) {
        setSuccess(true);
        Alert.alert('Đã gửi', 'Đường link cài đặt lại mật khẩu đã được gửi đến email của bạn.', [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/login')
            }
          }
        ]);
      }
    } catch (error: any) {
      Alert.alert(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <YStack flex={1} padding="$5" justifyContent="center" backgroundColor="$background" space="$4" marginBottom={10}>
      <YStack space="$2" marginBottom="$4" justifyContent="center">
        <YStack
          alignItems="center"
          justifyContent="center"
          padding={20}
          backgroundColor="$background">
          <Image
            source={require('~/assets/logo_icon_text.png')}
            alt="Logo"
            width={250}
            height={170}
            marginBottom={30}
          />
        </YStack>

        <H2 fontWeight="700" textAlign="center" marginBottom={20}>
          QUÊN MẬT KHẨU
        </H2>
        <Text fontSize="$4" color="$gray10" textAlign="center">
          Nhập email của tài khoản đã quên, chúng tôi sẽ gửi cho bạn đường link đặt lại mật khẩu.
        </Text>
      </YStack>

      {!success ? (
        <>
          <YStack space="$2" marginBottom={10} >
            <XStack
              alignItems="center"
              borderWidth={1}
              borderColor={emailError ? '$red10' : '$gray8'}
              borderRadius="$4"
              paddingHorizontal="$3">

              <Ionicons name="mail-outline" size={20} color="#888" />
              <Input
                flex={1}
                size="$4"
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onBlur={() => validateEmail(email)}
                borderWidth={0}
              />
              {emailError ? (
                <Text fontSize="$3" color="$red10">
                  {emailError}
                </Text>
              ) : null}
            </XStack>
          </YStack>

          {/* <Text fontSize="$3" color="$gray10" marginTop="$1">
            Hang tight! If your account is in our system, we'll send you a reset link.
          </Text> */}

          <Button
            size="$4"
            backgroundColor="#FF7A1E"
            color="white"
            onPress={handleResetPassword}
            disabled={isLoading}
            marginTop="$2">
            {isLoading ? <Spinner color="white" /> : 'Gửi'}
          </Button>
        </>
      ) : (
        <YStack
          space="$4"
          marginVertical="$4"
          padding="$4"
          backgroundColor="$green2"
          borderRadius="$2">
          <Text fontSize="$4" color="$green10" textAlign="center">
            Đường link cài đặt lại mật khẩu đã được gửi đến email của bạn.
          </Text>
        </YStack>
      )}

      <XStack justifyContent="center" marginTop="$4">
        <Button
          variant="outlined"
          onPress={() => router.replace('/login')}
          icon={<MaterialIcons name="arrow-back" size={20} color="#ff6600" />}>
          <Text color="$orange10" fontSize="$4">
            Quay lại đăng nhập
          </Text>
        </Button>
      </XStack>
    </YStack>
  );
}
