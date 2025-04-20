import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, TouchableOpacity } from 'react-native';
import { YStack, XStack, Button, Avatar } from 'tamagui';
import HeaderLeft from '../../../../components/header/HeaderLeft';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import InputField from '~/components/InputField';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { updateProfile } from '../../../../redux/thunks/profile';
import { formatDate } from '../../../utils/formatDate';

export default function UpdateProfile() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { goBackTo } = useLocalSearchParams();
    const { profile } = useSelector((state) => state.profile);

    const [formData, setFormData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (profile) {
            setFormData({
                ...profile,
                birthday: profile.birthday ? formatDate(profile.birthday) : ''
            });
        }
    }, [profile]);

    const handleChange = (field, value) => {
        if (formData) {
            setFormData({
                ...formData,
                [field]: value,
            });
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            handleChange('avatar', result.assets[0].uri);
        }
    };

    const handleClearField = (field) => {
        handleChange(field, '');
    };

    const handleSubmit = async () => {
        if (!formData?.name || !formData?.birthday) {
            alert('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            setIsLoading(true);
            const formDataToSend = new FormData();

            // Xử lý ảnh nếu có
            if (formData.avatar && formData.avatar.startsWith('file:')) {
                const filename = formData.avatar.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : 'image';
                
                formDataToSend.append('avatar', {
                    uri: formData.avatar,
                    name: filename,
                    type,
                });
            }

            // Thêm các trường khác
            formDataToSend.append('name', formData.name);
            formDataToSend.append('birthday', formData.birthday);

            const result = await dispatch(updateProfile(formDataToSend)).unwrap();

            if (result?.status === 'success') {
                alert('cập nhật thông tin thàng công');
                router.back();
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Có lỗi xảy ra khi cập nhật');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <YStack flex={1} backgroundColor="$gray2">
            <HeaderLeft goBack={goBackTo} title="Chỉnh sửa thông tin" />
            
            <XStack padding="$4" space="$4">
                {/* Left side - Avatar */}
                <YStack>
                    <Avatar circular size="$10" marginBottom="$2">
                        <Avatar.Image source={{ uri: formData?.avatar }} />
                        <Avatar.Fallback backgroundColor="$gray5">
                            <Ionicons name="person-outline" size={40} color="#666" />
                        </Avatar.Fallback>
                    </Avatar>
                    <Button
                        size="$2"
                        onPress={pickImage}
                        backgroundColor="$blue10"
                        color="white"
                    >
                        Đổi ảnh
                    </Button>
                </YStack>

                {/* Right side - Input fields */}
                <YStack flex={1} space="$4">
                    <InputField
                        id="name"
                        label="Họ và tên"
                        value={formData?.name || ''}
                        onChange={(value) => handleChange('name', value)}
                        placeholder="Nhập họ và tên"
                        rightElement={
                            formData?.name ? (
                                <TouchableOpacity 
                                    onPress={() => handleClearField('name')}
                                    style={{ padding: 8 }}
                                >
                                    <Ionicons name="close-circle" size={20} color="#666" />
                                </TouchableOpacity>
                            ) : null
                        }
                    />

                    <InputField
                        id="birthday"
                        label="Ngày sinh"
                        value={formData?.birthday || ''}
                        onChange={(value) => handleChange('birthday', value)}
                        placeholder="DD/MM/YYYY"
                        type="date"
                        rightElement={
                            formData?.birthday ? (
                                <TouchableOpacity 
                                    onPress={() => handleClearField('birthday')}
                                    style={{ padding: 8 }}
                                >
                                    <Ionicons name="close-circle" size={20} color="#666" />
                                </TouchableOpacity>
                            ) : null
                        }
                    />
                </YStack>
            </XStack>

            <Button
                backgroundColor="#0866ff"
                color="white"
                size="$4"
                margin="$4"
                onPress={handleSubmit}
                disabled={isLoading}
                icon={isLoading ? <ActivityIndicator color="white" /> : null}
            >
                {isLoading ? 'Đang lưu...' : 'LƯU'}
            </Button>
        </YStack>
    );
}
