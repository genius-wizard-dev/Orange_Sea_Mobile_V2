import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, TouchableOpacity } from 'react-native';
import { YStack, XStack, Button, Avatar, Label, RadioGroup, Text, TextArea } from 'tamagui';
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
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (profile) {
            setFormData({
                ...profile,
                birthday: profile.birthday ? formatDate(profile.birthday) : '',
                gender: profile.gender || 'M',
                bio: profile.bio || ''
            });
        }
    }, [profile]);

    const handleChange = (field, value) => {
        if (formData) {
            setFormData({
                ...formData,
                [field]: value,
            });

            // Clear the error for this field when it's changed
            if (errors[field]) {
                setErrors({
                    ...errors,
                    [field]: null
                });
            }
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
    const isValidName = (name) => /^[A-Za-zÀ-ỹ\s]+$/.test(name);

    const isOver11YearsOld = (birthday) => {
        if (!birthday) return false;

        const dateParts = birthday.split('-');
        if (dateParts.length !== 3) return false;

        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Tháng trong JS là từ 0–11
        const day = parseInt(dateParts[2], 10);

        const birthdate = new Date(year, month, day);
        if (isNaN(birthdate.getTime())) return false;

        const today = new Date();
        let age = today.getFullYear() - birthdate.getFullYear();
        const m = today.getMonth() - birthdate.getMonth();

        if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) {
            age--;
        }

        return age >= 11;
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData?.name) {
            newErrors.name = 'Vui lòng nhập họ và tên';
        } else if (!isValidName(formData.name)) {
            newErrors.name = 'Họ tên chỉ được chứa chữ cái và khoảng trắng';
        }

        if (!formData?.birthday) {
            newErrors.birthday = 'Vui lòng chọn ngày sinh';
        } else if (!isOver11YearsOld(formData.birthday)) {
            newErrors.birthday = 'Bạn phải trên 11 tuổi';
        }

        if (!formData?.gender) {
            newErrors.gender = 'Vui lòng chọn giới tính';
        }

        if (formData?.bio && formData.bio.length > 50) {
            newErrors.bio = 'Bio không được vượt quá 50 ký tự';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
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
            formDataToSend.append('gender', formData.gender);
            formDataToSend.append('bio', formData.bio || '');

            const result = await dispatch(updateProfile(formDataToSend)).unwrap();

            if (result?.statusCode === 200) {
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

    const handleGenderSelect = (selectedGender) => {
        handleChange('gender', selectedGender);
    };

    return (
        <YStack flex={1} backgroundColor="$gray2">
            <HeaderLeft goBack={goBackTo} title="Chỉnh sửa thông tin" />

            <XStack padding="$4" paddingBottom="$0" space="$4">
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
                        backgroundColor="#FF7A1E"
                        color="white"
                    >
                        Đổi ảnh
                    </Button>
                </YStack>

                {/* Right side - Input fields */}
                <YStack flex={1} space="$4">
                    <YStack>
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
                    </YStack>
                    <YStack>
                        <InputField
                            id="birthday"
                            label="Sinh Nhật"
                            value={formData?.birthday || null}
                            type="date"
                            onChange={(value) => handleChange('birthday', value)}
                            placeholder="Select your birthday"
                        />
                    </YStack>
                </YStack>
            </XStack>

            {/* Gender selection */}
            <YStack space="$2"  paddingLeft="$5" paddingRight="$5">
                <Text color="$gray15">Giới tính *</Text>
                <YStack flexDirection="row" space="$2">
                    <Button
                        flex={1}
                        backgroundColor={formData?.gender === 'M' ? '#FF7A1E' : '$gray5'}
                        onPress={() => handleGenderSelect('M')}
                        height={45}
                        borderRadius={10}
                    >
                        <Ionicons name="male-outline" size={19} color="#fff" />
                        <Text color={formData?.gender === 'M' ? 'white' : '$gray11'}>
                            Nam
                        </Text>
                    </Button>
                    <Button
                        flex={1}
                        backgroundColor={formData?.gender === 'F' ? '#FF7A1E' : '$gray5'}
                        onPress={() => handleGenderSelect('F')}
                        height={45}
                        borderRadius={10}
                    >
                        <Ionicons name="female-outline" size={19} color="#fff" />
                        <Text color={formData?.gender === 'F' ? 'white' : '$gray11'}>Nữ</Text>
                    </Button>
                </YStack>
                {errors.gender && <Text style={{ color: 'red', fontSize: 12 }}>{errors.gender}</Text>}
            </YStack>


            {/* Bio */}
            <YStack space="$2" paddingLeft="$5" paddingRight="$5">
                <Label htmlFor="bio" fontSize="$4">Bio <Text style={{ color: '#999', fontSize: 12 }}>(Tối đa 50 ký tự)</Text></Label>
                <TextArea
                    id="bio"
                    placeholder="Nhập bio của bạn"
                    value={formData?.bio || ''}
                    onChangeText={(value) => handleChange('bio', value)}
                    autoCapitalize="none"
                    backgroundColor="white"
                    borderWidth={1}
                    borderColor="$gray5"
                    minHeight={100}
                    maxLength={50}
                />
                <Text style={{ textAlign: 'right', fontSize: 12, color: '#666' }}>
                    {formData?.bio?.length || 0}/50
                </Text>
                {errors.bio && <Text style={{ color: 'red', fontSize: 12 }}>{errors.bio}</Text>}
            </YStack>

            <Button
                backgroundColor="#FF7A1E"
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
