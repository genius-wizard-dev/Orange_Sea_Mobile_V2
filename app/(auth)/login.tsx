import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { useDispatch } from 'react-redux';
import {
  Button,
  Form,
  H1,
  H2,
  Image,
  Input,
  Separator,
  Spinner,
  Text,
  XStack,
  YStack,
} from 'tamagui';
import { getProfile } from '~/redux/thunks/profile';
import { ENDPOINTS } from '~/service/api.endpoint';
import apiService from '~/service/api.service';
import { LoginRequest, LoginResponse } from '~/types/auth.login';
import { ProfileResponse } from '~/types/profile';
import {
  getFcmTokenFromSecureStore,
  setAccessToken,
  setRefreshToken,
} from '~/utils/token';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
  const dispatch = useDispatch();


  const validateForm = () => {
    const errors: { username?: string; password?: string } = {};

    if (!username.trim()) errors.username = 'Tên đăng nhập là bắt buộc';
    if (!password.trim()) errors.password = 'Mật khẩu là bắt buộc';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    try {
      if (!validateForm()) return;

      setLoading(true);
      setError('');

      const loginData: LoginRequest = {
        username: username.trim(),
        password: password.trim(),
      };

      const response = await apiService.post<LoginResponse>(ENDPOINTS.AUTH.LOGIN, loginData);


      if (response.status === 'success' && response.data) {
        setAccessToken(response.data.access_token);
        console.log(response.data.access_token);
        setRefreshToken(response.data.refresh_token);

        const profileRes: ProfileResponse = await dispatch(getProfile() as any).unwrap();
        if (profileRes.status === 'success') {
          setUsername('');
          setPassword('');
          router.replace('/');
        }


      } else {
        console.log(response)

        setError(response.message || 'Đăng nhập thất bại');
      }


    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred during login';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/forgot');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <Stack.Screen options={{ headerShown: false }} />
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          padding={20}
          backgroundColor="$background"
          space="$4">
          <Image
            source={require('~/assets/logo_icon_text.png')}
            alt="Logo"
            width={250}
            height={170}
            marginBottom={40}
          />
          <H2 ta="center">Đăng nhập</H2>
          <Text ta="center" theme="alt2" marginBottom={30}>
            Tham gia cộng đồng OrangeSea
          </Text>

          <Form width="100%" onSubmit={handleLogin} paddingHorizontal="$2">
            {error && (
              <Text color="$red10" marginBottom="$5" textAlign="center">
                {error}
              </Text>
            )}

            <YStack space="$4" width="100%">
              {/* Username Input */}
              <YStack>
                <XStack
                  alignItems="center"
                  borderWidth={1}
                  borderColor={fieldErrors.username ? '$red10' : '$gray8'}
                  borderRadius="$4"
                  paddingHorizontal="$3">
                  <Ionicons name="person-outline" size={20} color="#888" />
                  <Input
                    flex={1}
                    placeholder="Tên đăng nhập"
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      if (fieldErrors.username) {
                        setFieldErrors({ ...fieldErrors, username: undefined });
                      }
                    }}
                    marginLeft="$2"
                    borderWidth={0}
                    paddingVertical="$3"
                    autoCapitalize="none"
                  />
                </XStack>
                {fieldErrors.username && (
                  <Text color="$red10" fontSize="$2" marginTop="$1">
                    {fieldErrors.username}
                  </Text>
                )}
              </YStack>

              {/* Password Input */}
              <YStack>
                <XStack
                  alignItems="center"
                  borderWidth={1}
                  borderColor={fieldErrors.password ? '$red10' : '$gray8'}
                  borderRadius="$4"
                  paddingHorizontal="$3">
                  <Ionicons name="lock-closed-outline" size={20} color="#888" />
                  <Input
                    flex={1}
                    placeholder="Mật khẩu"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (fieldErrors.password) {
                        setFieldErrors({ ...fieldErrors, password: undefined });
                      }
                    }}
                    secureTextEntry={!showPassword}
                    marginLeft="$2"
                    borderWidth={0}
                    paddingVertical="$3"
                    autoCapitalize="none"
                  />
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#888"
                    onPress={() => setShowPassword(!showPassword)}
                  />
                </XStack>
                {fieldErrors.password && (
                  <Text color="$red10" fontSize="$2" marginTop="$1">
                    {fieldErrors.password}
                  </Text>
                )}
              </YStack>

              {/* Forgot Password */}
              <XStack justifyContent="flex-end">
                <Text color="$primary" onPress={handleForgotPassword} fontSize="$2">
                  Quên mật khẩu?
                </Text>
              </XStack>

              {/* Login Button */}
              <Button
                backgroundColor="#FF7A1E"
                borderRadius={15}
                height={55}
                marginTop={30}
                pressStyle={{
                  backgroundColor: '#FF7A1E',
                  borderWidth: 0,
                  scale: 0.98,
                }}
                onPress={handleLogin}
                disabled={loading}>
                <Text color="white" fontSize={16} fontWeight="600">
                  {loading ? <Spinner color="white" /> : 'Đăng nhập'}
                </Text>
              </Button>

              {/* Register */}
              <YStack alignItems="center" marginTop="$4" space="$2">
                <Separator />
                <XStack space="$2" marginTop="$2">
                  <Text>Chưa có tài khoản?</Text>
                  <Text color="$blue10"  fontWeight="bold" onPress={handleRegister}>
                    Đăng ký
                  </Text>
                </XStack>
              </YStack>
            </YStack>
          </Form>
        </YStack>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
