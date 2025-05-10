import React, { useState, useEffect } from 'react';
import {
    View,
    FlatList,
    Image,
    StyleSheet,
    TouchableOpacity,
    Text,
    ActivityIndicator,
    Dimensions,
    Alert
} from 'react-native';
import { XStack, YStack, Button } from 'tamagui';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { pickImage } from '../../utils/imageAccess';

const { width } = Dimensions.get('window');
const numColumns = 3;
const imageSize = (width - 32) / numColumns;

const ImageGallery = ({ onImageSelect, onSendImage }) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        checkPermissionAndOpenPicker();
    }, []);

    const checkPermissionAndOpenPicker = async () => {
        setLoading(true);
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    "Cần quyền truy cập",
                    "Ứng dụng cần quyền truy cập vào thư viện ảnh để tiếp tục.",
                    [
                        {
                            text: "Hủy",
                            style: "cancel"
                        },
                        {
                            text: "Cấp quyền",
                            onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync()
                        }
                    ]
                );
                setLoading(false);
                return;
            }

            // Sau khi có quyền, mở bộ chọn ảnh
            openImagePicker();
        } catch (error) {
            console.error('Lỗi khi kiểm tra quyền:', error);
            setLoading(false);
        }
    };

    const openImagePicker = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 1
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const imageSelected = {
                    id: `image-${new Date().getTime()}`,
                    uri: result.assets[0].uri,
                    width: result.assets[0].width,
                    height: result.assets[0].height
                };

                setSelectedImage(imageSelected);
                if (onImageSelect) {
                    onImageSelect(imageSelected);
                }
            }
        } catch (error) {
            console.error('Lỗi khi chọn ảnh:', error);
            Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendImage = () => {
        if (selectedImage && onSendImage) {
            // Tạo đúng định dạng để gửi ảnh
            const imageData = {
                uri: selectedImage.uri,
                type: selectedImage.uri.endsWith('.png') ? 'image/png' : 'image/jpeg',
                name: `photo-${Date.now()}.${selectedImage.uri.endsWith('.png') ? 'png' : 'jpg'}`,
                width: selectedImage.width,
                height: selectedImage.height
            };

            onSendImage(imageData);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#FF7A1E" />
                <Text style={styles.loadingText}>Đang xử lý...</Text>
            </View>
        );
    }

    const handleCancelImage = () => {
        setSelectedImage(null);
        if (onImageSelect) {
            // Gọi onImageSelect với null để báo hiệu hủy chọn ảnh
            onImageSelect(null);
        }
    };

    return (
        <YStack flex={1}>
            <YStack flex={1} padding={16} alignItems="center" justifyContent="space-between">
                {selectedImage ? (
                    <View style={styles.selectedImageContainer}>
                        {/* Ảnh đã chọn - đẩy lên cao hơn */}
                        <View style={styles.selectedImageContainer}>
                            <Image
                                source={{ uri: selectedImage.uri }}
                                style={styles.selectedImagePreview}
                                resizeMode="contain"
                            />
                        </View>

                        {/* Khoảng trống giữa ảnh và nút */}
                        <View style={{ flex: 0.1 }} />
                    </View>
                ) : (
                    <YStack flex={1} padding={16} alignItems="center" justifyContent="center">
                        <TouchableOpacity
                            style={styles.imagePickerPlaceholder}
                            onPress={openImagePicker}
                        >
                            <Ionicons name="images-outline" size={50} color="#65676b" />
                            <Text style={styles.imagePickerText}>Nhấn để chọn ảnh</Text>
                        </TouchableOpacity>
                    </YStack>
                )}
            </YStack>

            {selectedImage && (
                <XStack
                    justifyContent="space-between"
                    alignItems="center"
                    padding={10}
                    paddingHorizontal={10}
                    backgroundColor="#f4f4f4"
                    borderRadius={30}
                    elevation={1}
                >
                    {/* Nút X để đóng/hủy chọn ảnh */}
                    <Button
                        size="$4"
                        backgroundColor="#e8e1e1"
                        borderRadius={30}
                        onPress={handleCancelImage}
                        marginRight={5}
                    >
                        <Ionicons name="close-outline" size={35} color="#FF7A1E" />
                    </Button>

                    {/* Nút chọn ảnh khác */}
                    <Button
                        size="$4"
                        backgroundColor="#e8e1e1"
                        borderRadius={30}
                        onPress={openImagePicker}
                        paddingHorizontal={15}
                        icon={<Ionicons name="images-outline" size={20} color="#FF7A1E" />}
                    >
                        <Text style={styles.changeButtonText}>Chọn ảnh khác</Text>
                    </Button>

                    {/* Nút gửi ảnh */}
                    <Button
                        size="$4"
                        backgroundColor="#FF7A1E"
                        borderRadius={30}
                        onPress={handleSendImage}
                        icon={<Ionicons name="send" size={20} color="white" />}
                    >
                    </Button>
                </XStack>
            )}
        </YStack>
    );
};

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    loadingText: {
        marginTop: 10,
        color: '#65676b',
    },
    selectedImageContainer: {
        width: '100%',
        alignItems: 'center',
        // flex: 0.5, // Chiếm phần lớn không gian
        alignItems: 'center',
    },
    selectedImagePreview: {
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: 12,
        marginBottom: 16,
        marginBottom: 20,
    },
    changeImageButton: {
        backgroundColor: '#f0f2f5',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20
    },
    changeImageText: {
        color: '#FF7A1E',
        fontWeight: 'bold'
    },
    imagePickerPlaceholder: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f2f5',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        borderStyle: 'dashed'
    },
    imagePickerText: {
        marginTop: 10,
        color: '#65676b'
    },
    sendButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8
    },
    changeButtonText: {
        fontWeight: '500',
        fontSize: 15,
    }
});

export default ImageGallery;