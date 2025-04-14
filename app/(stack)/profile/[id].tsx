import { Href, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Spinner, YStack } from 'tamagui';
import { ENDPOINTS } from '~/service/api.endpoint';
import apiService from '~/service/api.service';
import { Profile, ProfileResponse } from '~/types/profile';

export default function Info() {
  const params = useLocalSearchParams();
  const [info, setInfo] = useState<Profile>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const id = params.id as string;
  const goBack = params.goBack as Href;

  const fetchInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.get<ProfileResponse>(ENDPOINTS.PROFILE.INFO(id));
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
    <View>
      {info && (
        <>
          <Text>{info?.name}</Text>
          <Text>{info?.username}</Text>
        </>
      )}
    </View>
  );
}
