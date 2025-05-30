import React, { useState } from 'react';
import { View, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';

const FileGallery = ({ onFileSelect, onSendFile }) => {
    const [selectedFile, setSelectedFile] = useState(null);

    const pickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*', // Cho phép tất cả loại file
                copyToCacheDirectory: true,
                multiple: false
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];

                // Kiểm tra kích thước file (tối đa 50MB)
                if (file.size > 10 * 1024 * 1024) {
                    Alert.alert('Lỗi', 'File quá lớn. Vui lòng chọn file nhỏ hơn 10MB.');
                    return;
                }

                const fileData = {
                    uri: file.uri,
                    name: file.name,
                    type: file.mimeType || 'application/octet-stream',
                    size: file.size
                };

                setSelectedFile(fileData);
                onFileSelect && onFileSelect(fileData);
            }
        } catch (error) {
            console.error('Lỗi khi chọn file:', error);
            Alert.alert('Lỗi', 'Không thể chọn file. Vui lòng thử lại.');
        }
    };

    const handleSendFile = () => {
        if (selectedFile) {
            onSendFile && onSendFile(selectedFile);
            setSelectedFile(null);
        }
    };

    const handleCancel = () => {
        setSelectedFile(null);
        onFileSelect && onFileSelect(null);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (mimeType) => {
        if (mimeType.includes('pdf')) return 'document-text';
        if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'grid';
        if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'easel';
        if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archive';
        if (mimeType.includes('audio')) return 'musical-notes';
        if (mimeType.includes('video')) return 'videocam';
        return 'document-outline';
    };

    if (selectedFile) {
        return (
            <YStack flex={1} padding={20} justifyContent="center" alignItems="center">
                {/* Header với nút X */}
                <XStack
                    width="100%"
                    justifyContent="flex-end"
                    alignItems="center"
                    marginBottom={20}
                >
                    <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                </XStack>

                {/* File preview */}
                <YStack
                    backgroundColor="#f8f9fa"
                    borderRadius={15}
                    padding={20}
                    width="100%"
                    alignItems="center"
                    marginBottom={30}
                    borderWidth={1}
                    borderColor="#e9ecef"
                >
                    <View style={styles.fileIconContainer}>
                        <Ionicons
                            name={getFileIcon(selectedFile.type)}
                            size={50}
                            color="#FF7A1E"
                        />
                    </View>

                    <Text
                        fontSize={16}
                        fontWeight="500"
                        color="#333"
                        textAlign="center"
                        marginTop={10}
                        numberOfLines={2}
                    >
                        {selectedFile.name}
                    </Text>

                    <Text
                        fontSize={14}
                        color="#666"
                        marginTop={5}
                    >
                        {formatFileSize(selectedFile.size)}
                    </Text>
                </YStack>

                {/* Action buttons */}
                <XStack space={15} width="100%">
                    <TouchableOpacity
                        style={[styles.actionButton, styles.changeButton]}
                        onPress={pickFile}
                    >
                        <Ionicons name="swap-horizontal" size={20} color="#FF7A1E" />
                        <Text color="#FF7A1E" fontWeight="500" marginLeft={8}>
                            Chọn file khác
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.sendButton]}
                        onPress={handleSendFile}
                    >
                        <Ionicons name="send" size={20} color="white" />
                        <Text color="white" fontWeight="500" marginLeft={8}>
                            Gửi file
                        </Text>
                    </TouchableOpacity>
                </XStack>
            </YStack>
        );
    }

    return (
        <YStack flex={1} justifyContent="center" alignItems="center" padding={20}>
            <TouchableOpacity style={styles.pickButton} onPress={pickFile}>
                <Ionicons name="folder-open-outline" size={50} color="#FF7A1E" />
                <Text
                    fontSize={16}
                    fontWeight="500"
                    color="#FF7A1E"
                    marginTop={15}
                    textAlign="center"
                >
                    Chọn file để gửi
                </Text>
                <Text
                    fontSize={14}
                    color="#666"
                    marginTop={5}
                    textAlign="center"
                >
                    Hỗ trợ mọi loại file (tối đa 10MB)
                </Text>
            </TouchableOpacity>
        </YStack>
    );
};

const styles = StyleSheet.create({
    closeButton: {
        padding: 6,
        borderRadius: 20,
        backgroundColor: '#e06b6f',
        position:"relative",
        top:40,
        zIndex:2
    },
    fileIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 122, 30, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 25,
        minHeight: 30,
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
        padding: 20,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FF7A1E',
        borderStyle: 'dashed',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 122, 30, 0.05)',
        width: '100%',
    },
});

export default FileGallery;