import React, { useState } from 'react';
import { View, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

const ImageGallery = ({ onImageSelect, onSendImage }) => {
    const [selectedMedia, setSelectedMedia] = useState(null);

    const pickMedia = async () => {
        try {
            // Xin quyền truy cập camera và thư viện ảnh
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh để chọn file');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All, // SỬA: Dùng MediaTypeOptions.All
                allowsEditing: false,
                quality: 0.8,
                videoMaxDuration: 60, // Giới hạn video 60 giây
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const media = result.assets[0];

                // Auto detect type dựa vào URI/filename
                const getMediaType = (uri, mimeType) => {
                    // Kiểm tra mimeType trước
                    if (mimeType && mimeType.startsWith('video/')) {
                        return 'VIDEO';
                    }

                    // Fallback kiểm tra extension từ URI
                    const extension = uri.toLowerCase().split('.').pop();
                    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp', 'm4v', 'mpg', 'mpeg'];

                    if (videoExtensions.includes(extension)) {
                        return 'VIDEO';
                    }

                    // Mặc định là IMAGE
                    return 'IMAGE';
                };

                const detectedType = getMediaType(media.uri, media.mimeType);

                // Kiểm tra kích thước file - CẢ ẢNH VÀ VIDEO ĐỀU DƯỚI 10MB
                const maxSize = 10 * 1024 * 1024; // 10MB cho cả ảnh và video

                if (media.fileSize && media.fileSize > maxSize) {
                    Alert.alert('Lỗi', `File quá lớn. Vui lòng chọn ${detectedType === 'VIDEO' ? 'video' : 'ảnh'} nhỏ hơn 10MB.`);
                    return;
                }

                const mediaData = {
                    uri: media.uri,
                    type: media.mimeType || (detectedType === 'VIDEO' ? 'video/mp4' : 'image/jpeg'),
                    mediaType: detectedType, // 'IMAGE' hoặc 'VIDEO'
                    width: media.width,
                    height: media.height,
                    fileSize: media.fileSize,
                    duration: media.duration, // Cho video
                    // Thêm name để FormData hoạt động đúng
                    name: detectedType === 'VIDEO'
                        ? `video-${Date.now()}.mp4`
                        : `image-${Date.now()}.jpg`
                };

                console.log('Media được chọn:', mediaData);
                console.log('Detected type:', detectedType);
                setSelectedMedia(mediaData);
                onImageSelect && onImageSelect(mediaData);
            }
        } catch (error) {
            console.error('Lỗi khi chọn media:', error);
            Alert.alert('Lỗi', 'Không thể chọn file. Vui lòng thử lại.');
        }
    };

    const handleSendMedia = () => {
        console.log('=== handleSendMedia được gọi ===');
        console.log('selectedMedia:', selectedMedia);
        console.log('onSendImage function:', typeof onSendImage);
        
        if (selectedMedia) {
            if (typeof onSendImage === 'function') {
                console.log('Đang gọi onSendImage...');
                onSendImage(selectedMedia);
                setSelectedMedia(null);
                console.log('Đã gọi onSendImage xong');
            } else {
                console.error('onSendImage không phải là function!');
                Alert.alert('Lỗi', 'Chức năng gửi không khả dụng');
            }
        } else {
            console.error('selectedMedia là null');
            Alert.alert('Lỗi', 'Chưa chọn file nào');
        }
    };

    const handleCancel = () => {
        setSelectedMedia(null);
        onImageSelect && onImageSelect(null);
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (selectedMedia) {
        return (
            <YStack flex={1} padding={20} justifyContent="center" alignItems="center">
                {/* Header với nút X */}
                <XStack
                    width="100%"
                    justifyContent="flex-end"
                    alignItems="center"
                    marginBottom={20}
                >
                    {/* <Text fontSize={18} fontWeight="600" color="#333">
                        {selectedMedia.mediaType === 'VIDEO' ? 'Xem trước video' : 'Xem trước ảnh'}
                    </Text> */}
                    <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                        <Ionicons name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                </XStack>

                {/* Media preview */}
                <YStack
                    backgroundColor="#f8f9fa"
                    borderRadius={15}
                    padding={10}
                    width="100%"
                    alignItems="center"
                    marginBottom={30}
                    borderWidth={1}
                    borderColor="#e9ecef"
                >
                    <View style={styles.mediaContainer}>
                        <Image
                            source={{ uri: selectedMedia.uri }}
                            style={styles.previewMedia}
                            contentFit="cover"
                        />

                        {/* Video overlay */}
                        {selectedMedia.mediaType === 'VIDEO' && (
                            <View style={styles.videoOverlay}>
                                <View style={styles.playButton}>
                                    <Ionicons name="play" size={30} color="white" />
                                </View>
                                {selectedMedia.duration && (
                                    <View style={styles.durationBadge}>
                                        <Text fontSize={12} color="white" fontWeight="500">
                                            {formatDuration(selectedMedia.duration)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Media info */}
                    <Text fontSize={14} color="#666" marginTop={10}>
                        {selectedMedia.mediaType === 'VIDEO' ? 'Video' : 'Ảnh'} • {selectedMedia.width}x{selectedMedia.height}
                        {selectedMedia.fileSize && ` • ${formatFileSize(selectedMedia.fileSize)}`}
                    </Text>
                </YStack>

                {/* Action buttons */}
                <XStack space={15} width="100%">
                    <TouchableOpacity
                        style={[styles.actionButton, styles.changeButton]}
                        onPress={pickMedia}
                    >
                        <Ionicons name="swap-horizontal" size={20} color="#FF7A1E" />
                        <Text color="#FF7A1E" fontWeight="500" marginLeft={8}>
                            Chọn khác
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.sendButton]}
                        onPress={handleSendMedia}
                    >
                        <Ionicons name="send" size={20} color="white" />
                        <Text color="white" fontWeight="500" marginLeft={8}>
                            Gửi {selectedMedia.mediaType === 'VIDEO' ? 'video' : 'ảnh'}
                        </Text>
                    </TouchableOpacity>
                </XStack>
            </YStack>
        );
    }

    return (
        <YStack flex={1} justifyContent="center" alignItems="center" padding={20}>
            <TouchableOpacity style={styles.pickButton} onPress={pickMedia}>
                <Ionicons name="albums-outline" size={50} color="#FF7A1E" />
                <Text
                    fontSize={16}
                    fontWeight="500"
                    color="#FF7A1E"
                    marginTop={15}
                    textAlign="center"
                >
                    Chọn ảnh hoặc video
                </Text>
                <Text
                    fontSize={14}
                    color="#666"
                    marginTop={5}
                    textAlign="center"
                >
                    Tối đa 10MB • Video tối đa 60 giây
                </Text>
            </TouchableOpacity>
        </YStack>
    );
};

const styles = StyleSheet.create({
    closeButton: {
        padding: 5,
        borderRadius: 20,
        backgroundColor: '#e06b6f',
        position:"relative",
        top:40,
        zIndex: 1,
    },
    mediaContainer: {
        width: 150,
        height: 150,
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
    },
    previewMedia: {
        width: '100%',
        height: '100%',
    },
    videoOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButton: {
        width: 50,
        height: 50,
        borderRadius: 30,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    durationBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 25,
        minHeight: 40,
    },
    changeButton: {
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#FF7A1E',
    },
    sendButton: {
        backgroundColor: '#FF7A1E',
    },
    pickButton: {
        padding: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FF7A1E',
        borderStyle: 'dashed',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 122, 30, 0.05)',
        width: '100%',
    },
});

export default ImageGallery;