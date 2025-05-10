import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button, Form, H1, H2, Image, Input, Separator, Spinner, Text, XStack, YStack } from 'tamagui';
import { ENDPOINTS } from '~/service/api.endpoint';
import apiService from '~/service/api.service';
import { setEmailInSecureStore } from '~/utils/token';
import { RegisterRequest, RegisterRequestSchema, RegisterRespone } from '../../types/auth.register';

export default function Register() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterRequest, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const validateForm = () => {
    try {
      RegisterRequestSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error: any) {
      const formattedErrors: Record<string, string> = {};
      error.errors.forEach((err: any) => {
        if (err.path.length > 0) {
          const field = err.path[0] as keyof RegisterRequest;
          formattedErrors[field] = err.message;
        }
      });
      setErrors(formattedErrors);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setApiError(null);

    try {
      const result = await apiService.post<RegisterRespone>(ENDPOINTS.AUTH.REGISTER, formData);

      if (result.status === 'success') {
        setEmailInSecureStore(formData.email);
        Alert.alert('Info:', result.message);
        router.push('/otp');
      } else {
        // Handle API failure status and message
        setApiError(result.message);
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      // Handle error from API service
      if (error.response?.data?.message) {
        setApiError(error.response.data.message);
      } else {
        setApiError('Đăng ký không thành công. Vui lòng thử lại sau!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <YStack f={1} p="$4" space="$4" justifyContent="center">
          <YStack space="$2" mb="$4"  justifyContent="center" alignItems='center'>
            <Image
              source={require('~/assets/logo_icon_text.png')}
              alt="Logo"
              width={250}
              height={170}
              marginBottom={40}
            />
            <H2 ta="center" fontWeight="700">ĐĂNG KÝ</H2>
            <Text ta="center" theme="alt2" marginBottom={30}>
              Tham gia cộng đồng OrangeSea
            </Text>
          </YStack>

          {apiError && (
            <YStack backgroundColor="$red2" p="$3" borderRadius="$2" mb="$2">
              <Text color="$red10" textAlign="center">
                {apiError}
              </Text>
            </YStack>
          )}

          <Form onSubmit={handleSubmit}>
            <YStack space="$4">
              <YStack>
                <XStack alignItems="center" width="100%" position="relative">
                  <Input
                    placeholder="Tên đăng nhập"
                    value={formData.username}
                    onChangeText={(text) => setFormData({ ...formData, username: text })}
                    size="$4"
                    borderColor={errors.username ? '$red10' : undefined}
                    autoCapitalize="none"
                    autoCorrect={false}
                    p="$3"
                    pl="$9"
                    width="100%"
                  />
                  <XStack position="absolute" left="$3" pointerEvents="none">
                    <Ionicons name="person-outline" size={20} color="#888" />
                  </XStack>
                </XStack>
                {errors.username && (
                  <Text color="$red10" mt="$1" fontSize="$2">
                    {errors.username}
                  </Text>
                )}
              </YStack>

              <YStack>
                <XStack alignItems="center" width="100%" position="relative">
                  <Input
                    placeholder="Email"
                    value={formData.email}
                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                    size="$4"
                    borderColor={errors.email ? '$red10' : undefined}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    p="$3"
                    pl="$9"
                    width="100%"
                  />
                  <XStack position="absolute" left="$3" pointerEvents="none">
                    <Ionicons name="mail-outline" size={20} color="#888" />
                  </XStack>
                </XStack>
                {errors.email && (
                  <Text color="$red10" mt="$1" fontSize="$2">
                    {errors.email}
                  </Text>
                )}
              </YStack>

              <YStack>
                <XStack alignItems="center" width="100%" position="relative">
                  <Input
                    placeholder="Mật khẩu"
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    secureTextEntry={!showPassword}
                    size="$4"
                    borderColor={errors.password ? '$red10' : undefined}
                    autoCapitalize="none"
                    autoCorrect={false}
                    p="$3"
                    pl="$9"
                    width="100%"
                  />
                  <XStack position="absolute" left="$3" pointerEvents="none">
                    <Ionicons name="lock-closed-outline" size={20} color="#888" />
                  </XStack>
                  <Button
                    size="$2"
                    chromeless
                    onPress={() => setShowPassword(!showPassword)}
                    position="absolute"
                    right="$2">
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#888"
                    />
                  </Button>
                </XStack>
                {errors.password && (
                  <Text color="$red10" mt="$1" fontSize="$2">
                    {errors.password}
                  </Text>
                )}
              </YStack>

              <Button
                theme="active"
                size="$4" mt="$2"
                onPress={handleSubmit}
                disabled={isLoading}
                backgroundColor="#FF7A1E"
                pressStyle={{
                  backgroundColor: '#FF7A1E',
                  borderWidth: 0,
                  scale: 0.98,
                }}
              >
                <Text color="white" fontSize={16} fontWeight="600">
                  {isLoading ? <Spinner color="white" /> : 'Đăng ký'}
                </Text>
              </Button>
            </YStack>
          </Form>

          <YStack ai="center" mt="$4">
            <Separator />
            <XStack space="$2" mt="$4">
              <Text>Đã có tài khoản?</Text>
              <Text color="$blue10" fontWeight="bold" onPress={() => router.push('/login')}>
                Đăng nhập
              </Text>
            </XStack>
          </YStack>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
