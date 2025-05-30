import { Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, View } from 'react-native';
import { YStack, Text, Button, Input, XStack, Spinner } from 'tamagui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import HeaderLeft from '../../../../components/header/HeaderLeft';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updatePassword } from '../../../../redux/thunks/account';
import socketService from '../../../../service/socket.service';

import { showPasswordUpdatedModal } from '../../../../redux/slices/profile';

export default function ChangePassword() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { goBackTo } = useLocalSearchParams();
    const { profile } = useSelector((state) => state.profile);

    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [loading, setLoading] = useState(false);

    // Thay đổi phần gọi updatePassword
    const handleUpdatePassword = async () => {
        // Validate passwords
        if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
            setError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            setError('Mật khẩu mới không khớp');
            return;
        }

        try {
            setLoading(true);

            // Bỏ id khỏi payload - API sẽ tự xác định user từ token
            const result = await dispatch(updatePassword({
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            })).unwrap();

            if (result.statusCode === 200) {
                // Emit sự kiện updatePassword nếu đổi mật khẩu thành công
                try {
                    // Thay emitPasswordReset bằng emitPasswordUpdate
                    await socketService.emitPasswordUpdate();
                    console.log('Đã thông báo cập nhật mật khẩu thành công');
                } catch (socketError) {
                    console.error('Lỗi khi thông báo cập nhật mật khẩu:', socketError);
                }

                // Hiển thị modal thông báo thay vì alert và back
                dispatch(showPasswordUpdatedModal());
            }
        } catch (error) {
            setError(error.message || error || 'Đã có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <YStack flex={1} backgroundColor="white">
                    <HeaderLeft goBack={goBackTo} title="Đổi mật khẩu" />

                    <YStack padding={20} space={20}>
                        <Text color="#666" textAlign="center">
                            Mật khẩu phải gồm chữ và số, không được chứa năm sinh, username và tên của bạn.
                        </Text>

                        {error && (
                            <Text color="red" textAlign="center">
                                {error}
                            </Text>
                        )}

                        <YStack space={15}>
                            <View>
                                <XStack justifyContent="space-between" alignItems="center" marginBottom={5}>
                                    <Text fontSize={16}>
                                        Mật khẩu hiện tại:
                                    </Text>
                                    <Button
                                        unstyled
                                        onPress={() => setShowPasswords(!showPasswords)}
                                    >
                                        <Text color="#E94057" fontSize={14}>
                                            {showPasswords ? 'Ẩn' : 'Hiện'}
                                        </Text>
                                    </Button>
                                </XStack>
                                <Input
                                    size="$4"
                                    borderWidth={1}
                                    borderColor="#ddd"
                                    placeholder="Nhập mật khẩu hiện tại"
                                    secureTextEntry={!showPasswords}
                                    value={passwords.currentPassword}
                                    onChangeText={(text) => setPasswords(prev => ({ ...prev, currentPassword: text }))}
                                />
                            </View>

                            <View>
                                <Text fontSize={16} marginBottom={5}>
                                    Mật khẩu mới:
                                </Text>
                                <Input
                                    size="$4"
                                    borderWidth={1}
                                    borderColor="#ddd"
                                    placeholder="Nhập mật khẩu mới"
                                    secureTextEntry={!showPasswords}
                                    value={passwords.newPassword}
                                    onChangeText={(text) => setPasswords(prev => ({ ...prev, newPassword: text }))}
                                />
                            </View>

                            <View>
                                <Text fontSize={16} marginBottom={5}>
                                    Nhập lại mật khẩu mới:
                                </Text>
                                <Input
                                    size="$4"
                                    borderWidth={1}
                                    borderColor="#ddd"
                                    placeholder="Nhập lại mật khẩu mới"
                                    secureTextEntry={!showPasswords}
                                    value={passwords.confirmPassword}
                                    onChangeText={(text) => setPasswords(prev => ({ ...prev, confirmPassword: text }))}
                                />
                            </View>
                        </YStack>

                        <Button
                            backgroundColor={Object.values(passwords).every(p => p) ? "#E94057" : "#ccc"}
                            height={45}
                            borderRadius={8}
                            marginTop={20}
                            onPress={handleUpdatePassword}
                            disabled={loading}
                        >
                            {loading ? (
                                <Spinner color="white" />
                            ) : (
                                <Text color="white" fontSize={16}>
                                    CẬP NHẬT
                                </Text>
                            )}
                        </Button>
                    </YStack>
                </YStack>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}
