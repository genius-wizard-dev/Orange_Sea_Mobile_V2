import { FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable } from 'react-native';
import { Input, Text, View, XStack, YStack } from 'tamagui';
interface InputFieldProps {
  id: string;
  label: string;
  value: string | null;
  type?: 'text' | 'image' | 'date';
  onChange: (value: any) => void;
  placeholder?: string;
}
export default function InputField({
  id,
  label,
  value,
  type = 'text',
  onChange,
  placeholder,
}: InputFieldProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleImagePick = async () => {
    try {
      setIsLoading(true);
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        alert('Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        onChange(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(selectedDate.toISOString().split('T')[0]);
    }
  };

  if (type === 'image') {
    return (
      <YStack alignItems="center">
        <Pressable onPress={handleImagePick} disabled={isLoading}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: '#F3F3F3',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: '#EEEEEE',
            }}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#E94057" />
            ) : value ? (
              <View style={{ width: '100%', height: '100%' }}>
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1,
                    backgroundColor: 'rgba(0,0,0,0.2)',
                  }}>
                  <FontAwesome name="camera" size={24} color="white" />
                </View>
                <Image
                  source={{ uri: value }}
                  style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                />
              </View>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <FontAwesome name="user-circle" size={50} color="#CCCCCC" />
                <Text color="#999999" marginTop="$1" fontSize={12}>
                  Tap to add
                </Text>
              </View>
            )}
          </View>
          <Text textAlign="center" marginTop="$2" color="$gray10" fontWeight="500">
            {label}
          </Text>
        </Pressable>
      </YStack>
    );
  }

  if (type === 'date') {
    return (
      <YStack space="$2">
        <Text fontWeight="500">{label}</Text>
        <Pressable onPress={() => setShowDatePicker(true)}>
          <XStack
            backgroundColor="white"
            borderRadius={15}
            height={50}
            alignItems="center"
            paddingHorizontal="$3"
            justifyContent="space-between"
            borderWidth={1}
            borderColor="#F5F5F5">
            <Text color={value ? '$color' : '$gray9'}>{value || placeholder || 'Select date'}</Text>
            <FontAwesome name="calendar" size={18} color="#888" />
          </XStack>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={value ? new Date(value) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeDate}
            maximumDate={new Date()}
          />
        )}
      </YStack>
    );
  }

  return (
    <YStack space="$2">
      <Text fontWeight="500">{label}</Text>
      <Input
        height={50}
        placeholder={placeholder || `Enter your ${label.toLowerCase()}`}
        value={value || ''}
        onChangeText={onChange}
        autoCapitalize="none"
        backgroundColor="white"
        borderRadius={15}
        borderWidth={1}
        borderColor="#F5F5F5"
        paddingVertical="$3"
      />
    </YStack>
  );
}
