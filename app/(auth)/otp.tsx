import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, TextInput } from 'react-native';
import { Button, Spinner, Text, XStack, YStack } from 'tamagui';
import { ENDPOINTS } from '~/service/api.endpoint';
import apiService from '~/service/api.service';
import { getEmailFromSecureStore, removeEmailFromSecureStore } from '~/utils/token';

export default function OTP() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<Array<TextInput | null>>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchEmail() {
      try {
        const emailData = await getEmailFromSecureStore();
        setEmail(emailData);
        // Start countdown timer when email is fetched
        setTimeLeft(60);
      } catch (error) {
        console.error('Failed to get email:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEmail();
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timerId);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleCancelRegister = () => {
    removeEmailFromSecureStore();
    router.replace('/');
  };

  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1) {
      text = text[text.length - 1];
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto focus to next input
    if (text !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && index > 0 && otp[index] === '') {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setVerifying(true);
    try {
      const response = await apiService.post<{ success: boolean; message?: string }>(
        ENDPOINTS.AUTH.VERIFY_OTP,
        {
          email,
          otp: otpValue,
        }
      );

      if (response.success) {
        Alert.alert('Success', 'OTP verified successfully', [
          { text: 'OK', onPress: () => router.replace('/') },
        ]);
        await removeEmailFromSecureStore();
        router.replace('/');
      } else {
        Alert.alert('Verification Failed', response.message || 'Invalid OTP, please try again');
        await removeEmailFromSecureStore();
        router.replace('/');
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setResending(true);
    try {
      const response = await apiService.post<{ success: boolean; message?: string }>(
        ENDPOINTS.AUTH.RESEND_OTP,
        { email }
      );

      if (response.success) {
        setTimeLeft(60);
        setCanResend(false);
        Alert.alert('Success', 'Mã OTP đã được gửi lại thành công', );
        // Removed redirect to '/' to keep user on verification page
      } else {
        Alert.alert('Error', response.message || 'Failed to resend OTP');
        await removeEmailFromSecureStore();
        router.replace('/');
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to resend OTP');
      await removeEmailFromSecureStore();
      router.replace('/');
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <Spinner size="large" color="$orange10" />
      </YStack>
    );
  }

  return (
    <YStack flex={1} padding="$4" justifyContent="center" backgroundColor="$background" space="$4">
      <YStack space="$2" marginBottom="$4">
        <Text fontSize="$8" fontWeight="bold" textAlign="center">
          Xác thực OTP
        </Text>
        <Text fontSize="$4" color="$gray10" textAlign="center">
          Vui lòng nhập 6 mã số được gửi từ email{'\n'}
          <Text color="$orange10" fontWeight="bold">
            {email}
          </Text>
        </Text>
      </YStack>

      <XStack justifyContent="space-between" marginVertical="$4">
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={{
              width: 45,
              height: 50,
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 8,
              textAlign: 'center',
              fontSize: 20,
              fontWeight: 'bold',
              backgroundColor: '#f9f9f9',
            }}
            value={digit}
            onChangeText={(text) => handleOtpChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </XStack>

      <YStack space="$2">
        <Button
          size="$4"
          backgroundColor="$orange10"
          color="white"
          onPress={handleVerifyOtp}
          disabled={verifying || otp.some((digit) => digit === '')}>
          {verifying ? <Spinner color="white" /> : 'Xác thực OTP'}
        </Button>

        <XStack justifyContent="center" marginTop="$2" space="$2">
          <Text fontSize="$3" color="$gray10">
            Không nhận được mã?
          </Text>
          {canResend ? (
            <Button
              chromeless
              onPress={handleResendOtp}
              disabled={resending}
              paddingHorizontal="$0"
              paddingVertical="$0">
              <Text fontSize="$3" color="$orange10" fontWeight="bold">
                {resending ? 'Đang gửi...' : 'Gửi lại OTP'}
              </Text>
            </Button>
          ) : (
            <Text fontSize="$3" color="$gray10">
              Gửi lại sau{timeLeft}s
            </Text>
          )}
        </XStack>
      </YStack>

      <XStack justifyContent="center" marginTop="$4">
        <Button
          variant="outlined"
          onPress={handleCancelRegister}
          icon={<MaterialIcons name="cancel" size={20} color="#ff6600" />}>
          <Text color="$orange10" fontSize="$4">
            Huỷ đăng ký
          </Text>
        </Button>
      </XStack>
    </YStack>
  );
}
