import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Button, H3, Paragraph, ScrollView, Text, YStack } from 'tamagui';
import InputField from '../../components/InputField';
import { updateProfile } from '../../redux/thunks/profile';
import { formatDate } from '../utils/formatDate';

const DEFAULT_AVATAR = "https://res.cloudinary.com/dubwmognz/image/upload/v1744715587/profile-avatars/profile_67fe2aaf936aacebb59fb978.png";

const isValidName = (name) => /^[a-zA-Z0-9\s]+$/.test(name);
const isValidPhone = (phone) => /^0\d{9}$/.test(phone);
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



export default function Setup() {
    const router = useRouter();
    const dispatch = useDispatch();
    const [formData, setFormData] = useState(null);
    const { profile: userProfile } = useSelector((state) => state.profile);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // console.log(new Date().toString())


    useEffect(() => {
        if (userProfile) {
            setFormData({
                ...userProfile,
                avatar: userProfile.avatar || DEFAULT_AVATAR,
                birthday: userProfile.birthday ? formatDate(userProfile.birthday) : formatDate(new Date().toString())
            });
        }
    }, [userProfile]);


    const handleChange = (field, value) => {
        if (formData) {
            setFormData({
                ...formData,
                [field]: value,
            });
            
        }
    };
    
    // console.log(formData)

    const validateForm = () => {
        if (!formData?.name || !isValidName(formData.name)) {
            setErrors({ name: 'Tên không được chứa ký tự đặc biệt' });
            alert('❌ Tên không được chứa ký tự đặc biệt');
            return false;
        }

        if (!formData?.phone || !isValidPhone(formData.phone)) {
            setErrors({ phone: 'Số điện thoại không hợp lệ' });
            alert('❌ Số điện thoại không hợp lệ');
            return false;
        }

        if (!formData?.birthday || !isOver11YearsOld(formData.birthday)) {
            setErrors({ birthday: 'Bạn phải trên 11 tuổi' });
            alert('❌ Bạn phải trên 11 tuổi');
            return false;
        }

        // Nếu không lỗi
        setErrors({});
        return true;
    };


    const handleGenderSelect = (selectedGender) => {
        handleChange('gender', selectedGender);
    };

    const handleSubmit = async () => {
        if (!formData || !validateForm()) return;

        try {
            setIsSubmitting(true);
            const formDataToSend = new FormData();

            // Xử lý avatar
            if (formData.avatar && formData.avatar !== DEFAULT_AVATAR) {
                if (formData.avatar.startsWith('file:')) {
                    const filename = formData.avatar.split('/').pop();
                    const match = /\.(\w+)$/.exec(filename || '');
                    const type = match ? `image/${match[1]}` : 'image';

                    formDataToSend.append('avatar', {
                        uri: formData.avatar,
                        name: filename,
                        type,
                    });
                }
            } else {
                formDataToSend.append('avatar', DEFAULT_AVATAR);
            }

            // Thêm các trường khác
            formDataToSend.append('name', formData.name);
            formDataToSend.append('phone', formData.phone);
            formDataToSend.append('gender', formData.gender || 'M'); // Mặc định là nam nếu không chọn
            if (formData.bio) formDataToSend.append('bio', formData.bio);
            formDataToSend.append('birthday', formData.birthday);

            const result = await dispatch(updateProfile(formDataToSend)).unwrap();

            if (result?.status === 'success') {
                alert('Cập nhật thông tin thành công!');
                router.replace('/chat');
            }
        } catch (error) {
            console.error('Lỗi cập nhật:', error);
            alert('Có lỗi xảy ra khi cập nhật thông tin');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView backgroundColor="$background" padding="$4" flex={1}>
            <YStack space="$4" paddingTop="$6" paddingBottom="$8">
                <YStack alignItems="center" space="$2">
                    <H3 fontWeight="bold" color="#E94057">
                        Hoàn thành thông tin cá nhân
                    </H3>
                    <Paragraph color="$gray10" textAlign="center">
                        Điền đầy đủ các thông tin để tiếp tục
                    </Paragraph>
                </YStack>

                <YStack alignItems="center" marginVertical="$5">
                    <InputField
                        id="avatar"
                        label="Ảnh đại diện"
                        placeholder='Chọn ảnh đại diện'
                        value={formData?.avatar || null}
                        type="image"
                        onChange={(value) => handleChange('avatar', value)}
                    />
                </YStack>

                <YStack space="$5">
                    <InputField
                        id="name"
                        label="Tên người dùng *"
                        value={formData?.name || ''}
                        onChange={(value) => handleChange('name', value)}
                        placeholder="Nhập tên của bạn"
                        error={errors.name}
                    />

                    <InputField
                        id="phone"
                        label="Số điện thoại *"
                        value={formData?.phone || ''}
                        onChange={(value) => handleChange('phone', value)}
                        placeholder="VD: 0886211355"
                        error={errors.phone}
                    />

                    <InputField
                        id="bio"
                        label="Tiểu sử"
                        placeholder="Nhập tiểu sử (không bắt buộc)"
                        value={formData?.bio || ''}
                        onChange={(value) => handleChange('bio', value)}
                    />

                    <InputField
                        id="birthday"
                        label="Ngày sinh *"
                        value={formData?.birthday || null}
                        type="date"
                        onChange={(value) => handleChange('birthday', value)}
                        placeholder="Select your birthday"
                    />

                    <YStack space="$2">
                        <Text color="$gray11">Giới tính *</Text>
                        <YStack flexDirection="row" space="$2">
                            <Button
                                flex={1}
                                backgroundColor={formData?.gender === 'M' ? '#E94057' : '$gray5'}
                                onPress={() => handleGenderSelect('M')}
                                height={45}
                                borderRadius={10}
                            >
                                <Text color={formData?.gender === 'M' ? 'white' : '$gray11'}>Nam</Text>
                            </Button>
                            <Button
                                flex={1}
                                backgroundColor={formData?.gender === 'F' ? '#E94057' : '$gray5'}
                                onPress={() => handleGenderSelect('F')}
                                height={45}
                                borderRadius={10}
                            >
                                <Text color={formData?.gender === 'F' ? 'white' : '$gray11'}>Nữ</Text>
                            </Button>
                        </YStack>
                    </YStack>

                    <Button
                        size="$4"
                        backgroundColor="#E94057"
                        color="white"
                        marginTop="$6"
                        fontWeight="bold"
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        alignSelf="stretch"
                        height={60}
                        borderRadius={15}
                        pressStyle={{ opacity: 0.9 }}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <>
                                <Text color="white" fontSize={16}>Hoàn thành</Text>
                            </>
                        )}
                    </Button>
                </YStack>
            </YStack>
        </ScrollView>
    );
}
