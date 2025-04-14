import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, Input, Spinner, Text, XStack, YStack } from 'tamagui';
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
        Alert.alert('Reset password link has been sent to your email');
      }
    } catch (error: any) {
      Alert.alert(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <YStack flex={1} padding="$4" justifyContent="center" backgroundColor="$background" space="$4">
      <YStack space="$2" marginBottom="$4">
        <Text fontSize="$8" fontWeight="bold" textAlign="center">
          Reset Password
        </Text>
        <Text fontSize="$4" color="$gray10" textAlign="center">
          Enter your email address and we'll send you instructions to reset your password.
        </Text>
      </YStack>

      {!success ? (
        <>
          <YStack space="$2">
            <Text fontSize="$4" fontWeight="500">
              Email
            </Text>
            <Input
              size="$4"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onBlur={() => validateEmail(email)}
              leftElement={
                <MaterialIcons name="email" size={20} color="#777" style={{ marginLeft: 10 }} />
              }
            />
            {emailError ? (
              <Text fontSize="$3" color="$red10">
                {emailError}
              </Text>
            ) : null}
          </YStack>

          <Text fontSize="$3" color="$gray10" marginTop="$1">
            Hang tight! If your account is in our system, we'll send you a reset link.
          </Text>

          <Button
            size="$4"
            backgroundColor="$orange10"
            color="white"
            onPress={handleResetPassword}
            disabled={isLoading}
            marginTop="$2">
            {isLoading ? <Spinner color="white" /> : 'Reset Password'}
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
            Reset password link has been sent to your email. Please check your inbox.
          </Text>
        </YStack>
      )}

      <XStack justifyContent="center" marginTop="$4">
        <Button
          variant="outlined"
          onPress={() => router.replace('/login')}
          icon={<MaterialIcons name="arrow-back" size={20} color="#ff6600" />}>
          <Text color="$orange10" fontSize="$4">
            Back to Login
          </Text>
        </Button>
      </XStack>
    </YStack>
  );
}
