import React, { useRef, useEffect, useState } from 'react';
import {
    Modal,
    View,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Animated,
    Alert,
    StatusBar,
    Platform
} from 'react-native';
import { Image } from 'tamagui';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import NetInfo from '@react-native-community/netinfo';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ImageViewer = ({ visible, imageUri, onClose }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.3)).current;
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (visible) {
            // Ẩn status bar khi mở modal
            // StatusBar.setHidden(true, 'fade');

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [visible]);

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.3,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start(() => {
            onClose();
        });
    };

    const downloadImage = async () => {

        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
            Alert.alert('Lỗi', 'Không có kết nối internet');
            return;
        }

        if (isDownloading) return;

        setIsDownloading(true);
        try {
            // Xin quyền truy cập thư viện ảnh
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh để tải xuống');
                return;
            }

            // Tạo tên file unique
            const filename = `image_${Date.now()}.jpg`;
            const fileUri = FileSystem.documentDirectory + filename;

            // Retry logic với timeout
            const downloadWithRetry = async (retries = 3) => {
                for (let i = 0; i < retries; i++) {
                    try {
                        console.log(`Đang tải ảnh, lần thử ${i + 1}/${retries}...`);

                        const downloadResult = await Promise.race([
                            FileSystem.downloadAsync(imageUri, fileUri),
                            new Promise((_, reject) =>
                                setTimeout(() => reject(new Error('Timeout')), 10000)
                            )
                        ]);

                        return downloadResult;
                    } catch (error) {
                        console.log(`Lần thử ${i + 1} thất bại:`, error.message);
                        if (i === retries - 1) throw error;

                        // Đợi 1 giây trước khi thử lại
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            };

            const downloadResult = await downloadWithRetry();

            if (downloadResult.status === 200) {
                // Kiểm tra file đã tồn tại
                const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
                if (fileInfo.exists && fileInfo.size > 0) {
                    // Lưu vào thư viện ảnh
                    await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
                    Alert.alert('Thành công', 'Ảnh đã được lưu vào thư viện');

                    // Xóa file tạm
                    await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
                } else {
                    throw new Error('File tải về bị lỗi hoặc rỗng');
                }
            } else {
                throw new Error(`HTTP ${downloadResult.status}: Không thể tải ảnh`);
            }

        } catch (error) {
            console.error('Lỗi khi tải ảnh:', error);

            // Kiểm tra xem có phải lỗi network không
            if (error.message.includes('Unable to resolve host') ||
                error.message.includes('No address associated with hostname')) {
                Alert.alert(
                    'Lỗi mạng',
                    'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet và thử lại.',
                    [
                        { text: 'Thử lại', onPress: downloadImage },
                        { text: 'Hủy', style: 'cancel' }
                    ]
                );
            } else if (error.message === 'Timeout') {
                Alert.alert(
                    'Timeout',
                    'Tải ảnh quá lâu. Vui lòng thử lại.',
                    [
                        { text: 'Thử lại', onPress: downloadImage },
                        { text: 'Hủy', style: 'cancel' }
                    ]
                );
            } else {
                Alert.alert('Lỗi', `Không thể tải ảnh: ${error.message}`);
            }
        } finally {
            setIsDownloading(false);
        }
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={handleClose}
            statusBarTranslucent={true}
        >
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                {/* Background overlay */}
                <TouchableOpacity
                    style={styles.backgroundTouchable}
                    activeOpacity={1}
                    onPress={handleClose}
                />

                {/* Header với nút đóng và tải xuống */}
                <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                    <View style={styles.headerLeft} />
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            style={[styles.headerButton, isDownloading && styles.downloadingButton]}
                            onPress={downloadImage}
                            disabled={isDownloading}
                        >
                            <Ionicons
                                name={isDownloading ? "hourglass-outline" : "download-outline"}
                                size={24}
                                color="white"
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={handleClose}
                        >
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Image container */}
                <Animated.View
                    style={[
                        styles.imageContainer,
                        {
                            transform: [{ scale: scaleAnim }],
                            opacity: fadeAnim
                        }
                    ]}
                >
                    <Image
                        source={{ uri: imageUri }}
                        style={styles.fullImage}
                        resizeMode="contain"
                    />
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backgroundTouchable: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    header: {
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 1000,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        padding: 7,
        backgroundColor: '#FF7A1E',
        borderRadius: 25,
        marginLeft: 10,
    },
    imageContainer: {
        width: screenWidth,
        height: screenHeight * 0.8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '100%',
        height: '100%',
    },
    downloadingButton: {
        backgroundColor: 'rgba(255, 122, 30, 0.6)',
    },
});

export default ImageViewer;