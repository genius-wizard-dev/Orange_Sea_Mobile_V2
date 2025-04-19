// Trong màn hình updateProfile (updateProfile.js)
import { useLocalSearchParams, useRouter, useSearchParams } from 'expo-router';
import { TouchableOpacity, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { View, YStack, XStack, Avatar, Text, Input, Button } from 'tamagui';
import HeaderLeft from '../../../../components/header/HeaderLeft';
import { useSelector } from 'react-redux';

export default function UpdateProfile() {
    const router = useRouter();
    const { goBackTo } = useLocalSearchParams()
    const { profile } = useSelector((state) => state.profile);

    return (
        <YStack flex={1} backgroundColor="$gray2">
            <HeaderLeft goBack={goBackTo} title="Chỉnh sửa thông tin" />

            <YStack padding="$4" space="$4">
                {/* Avatar Section */}
                <XStack alignItems="center" justifyContent="center" marginVertical="$4">
                    <Avatar circular size="$10">
                        <Avatar.Image source={{ uri: profile?.avatar }} />
                        <Avatar.Fallback backgroundColor="$gray5">
                            <Ionicons name="person-outline" size={40} color="#666" />
                        </Avatar.Fallback>
                    </Avatar>
                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            right: '35%',
                            backgroundColor: '#fff',
                            padding: 8,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: '#E8E8E8'
                        }}
                    >
                        <Ionicons name="camera-outline" size={24} color="#666" />
                    </TouchableOpacity>
                </XStack>

                {/* Form Fields */}
                <YStack space="$4">
                    <YStack>
                        <Text color="$gray11" fontSize="$4" marginBottom="$2">Họ và tên</Text>
                        <Input
                            size="$4"
                            borderWidth={1}
                            borderColor="#E8E8E8"
                            backgroundColor="white"
                            defaultValue={profile?.name}
                        />
                    </YStack>

                    <YStack>
                        <Text color="$gray11" fontSize="$4" marginBottom="$2">Ngày sinh</Text>
                        <XStack
                            backgroundColor="white"
                            borderWidth={1}
                            borderColor="#E8E8E8"
                            padding="$3"
                            borderRadius="$4"
                            alignItems="center"
                            justifyContent="space-between"
                        >
                            <Text>23/10/1995</Text>
                            <Ionicons name="chevron-forward-outline" size={24} color="#666" />
                        </XStack>
                    </YStack>

                    <YStack>
                        <Text color="$gray11" fontSize="$4" marginBottom="$2">Giới tính</Text>
                        <XStack space="$4">
                            <XStack
                                backgroundColor="white"
                                borderWidth={1}
                                borderColor="#0866ff"
                                padding="$3"
                                borderRadius="$4"
                                alignItems="center"
                                space="$2"
                                flex={1}
                            >
                                <View backgroundColor="#0866ff" borderRadius={20} padding={2}>
                                    <Ionicons name="checkmark-outline" size={16} color="white" />
                                </View>
                                <Text>Nam</Text>
                            </XStack>
                            <XStack
                                backgroundColor="white"
                                borderWidth={1}
                                borderColor="#E8E8E8"
                                padding="$3"
                                borderRadius="$4"
                                alignItems="center"
                                space="$2"
                                flex={1}
                            >
                                <View borderWidth={1} borderColor="#666" borderRadius={20} padding={2}>
                                    <Ionicons name="checkmark-outline" size={16} color="transparent" />
                                </View>
                                <Text>Nữ</Text>
                            </XStack>
                        </XStack>
                    </YStack>
                </YStack>

                {/* Save Button */}
                <Button
                    backgroundColor="#0866ff"
                    color="white"
                    size="$4"
                    marginTop="$4"
                >
                    LƯU
                </Button>
            </YStack>
        </YStack>
    );
}
