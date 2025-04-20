import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { View, ImageBackground } from 'react-native';
import { Avatar, YStack, XStack, Text, Button, Spinner } from 'tamagui';
import { useEffect, useState } from 'react';
import { ENDPOINTS } from '../../../service/api.endpoint';
import apiService from '../../../service/api.service';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSelector } from 'react-redux';

export default function Info() {
  const { profile } = useSelector((state) => state.profile);
  const params = useLocalSearchParams();
  const router = useRouter();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const id = params.id;
  const goBack = params.goBack;

  const fetchInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.get(ENDPOINTS.PROFILE.INFO(id));
      if (result.status === 'success' && result.data) {
        setInfo(result.data);
      } else {
        setError('Could not load profile data');
      }
    } catch (error) {
      console.log(error);
      setError('An error occurred while loading the profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, [id]);

  if (loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" space="$4">
        <Spinner size="large" color="#E94057" />
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" space="$4">
        <Text style={{ color: 'red', marginBottom: 20 }}>{error}</Text>
        <Button onPress={fetchInfo} backgroundColor="#E94057" color="white">
          Try Again
        </Button>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="white">
      {/* Cover Image */}
      <View
        style={{
          height: 150,
          justifyContent: 'flex-end',
          padding: 20,
          backgroundColor: '#E94057',
        }}
      >
      </View>

      {/* Profile Info Section */}
      <YStack marginTop={-50} paddingHorizontal={20}>
        {/* Avatar */}
        <Avatar
          circular
          size={100}
          borderWidth={4}
          borderColor="white"
        >
          <Avatar.Image source={{ uri: profile?.avatar }} />
          <Avatar.Fallback>
            <Ionicons name="person" size={50} color="#666" />
          </Avatar.Fallback>
        </Avatar>

        {/* Name and Bio */}
        <YStack marginTop={10} space={4}>
          <Text fontSize={24} fontWeight="bold">
            {profile?.name}
          </Text>
          <Text fontSize={16} color="$gray10">
            {profile?.bio || 'UEHer'}
          </Text>
        </YStack>

        {/* Buttons Section */}
        <XStack marginTop={20} space={15}>
          <Button
            flex={1}
            width="100%"
            backgroundColor="white"
            borderWidth={1}
            borderColor="#E8E8E8"
            borderRadius={15}
            padding={15}
            pressStyle={{ opacity: 0.7 }}
          >
            <XStack alignItems="center" space={10} width="100%" height={100} justifyContent="center">
              <Ionicons name="images-outline" size={24} color="#666" />
              <Text fontWeight="500">Ảnh của tôi</Text>
            </XStack>
          </Button>
        </XStack>
      </YStack>
    </YStack>
  );
}
