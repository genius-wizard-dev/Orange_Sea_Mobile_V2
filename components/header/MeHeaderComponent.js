import { View, TouchableOpacity } from 'react-native';
import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

const MeHeaderComponent = ({ navigation }) => {
  const router = useRouter();
  return (
    <View>
      <TouchableOpacity onPress={() => router.push('/setting/meSetting')}>
        <Ionicons name="settings-outline" size={25} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default MeHeaderComponent;
