import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Button, H2, Paragraph, ScrollView, YStack } from 'tamagui';
import InputField from '~/components/InputField';

import { RootState } from '~/redux/store';
import { updateProfile } from '~/redux/thunks/profile';
import { Profile } from '~/types/profile';




export default function Setup() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { profile: userProfile } = useSelector((state: RootState) => state.profile);
  useEffect(() => {
    if (userProfile) {
      setFormData(userProfile);
    }
  }, [userProfile]);

  const handleChange = (field: keyof Profile, value: string) => {
    if (formData) {
      setFormData({
        ...formData,
        [field]: value,
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData) return;

    try {
      setIsLoading(true);

      const formDataToSend = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === 'avatar' && typeof value === 'string' && value.startsWith('file:')) {
            const filename = value.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `image/${match[1]}` : 'image';

            formDataToSend.append('avatar', {
              uri: value,
              name: filename,
              type,
            } as any);
          } else {
            formDataToSend.append(key, value.toString());
          }
        }
      });

      const result = await dispatch(updateProfile(formDataToSend as any) as any).unwrap();

      if (result?.status === 'success') {
        alert('Profile updated successfully!');
        router.replace('/chat');
      } else {
        alert(result?.message || 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('An error occurred while updating your profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView backgroundColor="$background" padding="$4" flex={1}>
      <YStack space="$4" paddingTop="$6">
        <YStack alignItems="center" space="$2">
          <H2 fontWeight="bold" color="#E94057">
            Complete Your Profile
          </H2>
          <Paragraph color="$gray10" textAlign="center">
            Let's set up your account information
          </Paragraph>
        </YStack>

        <YStack alignItems="center" marginVertical="$5">
          <InputField
            id="avatar"
            label="Profile Photo"
            value={formData?.avatar || null}
            type="image"
            onChange={(value) => handleChange('avatar', value)}
          />
        </YStack>

        <YStack space="$5">
          <InputField
            id="name"
            label="Full Name"
            value={formData?.name || null}
            onChange={(value) => handleChange('name', value)}
            placeholder="Enter your full name"
          />

          <InputField
            id="phone"
            label="Phone Number"
            value={formData?.phone || null}
            onChange={(value) => handleChange('phone', value)}
            placeholder="Enter your phone number"
          />
          <InputField
            id="bio"
            label="Bio"
            placeholder="Enter your bio"
            value={formData?.bio || ''}
            onChange={(value) => handleChange('bio', value)}
          />

          <InputField
            id="birthday"
            label="Birthday"
            value={formData?.birthday || null}
            type="date"
            onChange={(value) => handleChange('birthday', value)}
            placeholder="Select your birthday"
          />

          <Button
            size="$4"
            backgroundColor="#E94057"
            color="white"
            marginTop="$6"
            fontWeight="bold"
            onPress={handleSubmit}
            disabled={isLoading}
            alignSelf="stretch"
            height={60}
            borderRadius={15}
            pressStyle={{ opacity: 0.9 }}
            icon={
              isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Feather name="check" size={18} color="white" />
              )
            }>
            {isLoading ? 'Updating...' : 'Complete Setup'}
          </Button>
        </YStack>
      </YStack>
    </ScrollView>
  );
}
