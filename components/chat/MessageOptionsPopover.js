import { Popover, YStack, Button, View } from 'tamagui'
import React, { useState, useEffect, useRef } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Pressable, Dimensions, StyleSheet, ActivityIndicator, Animated, Clipboard } from 'react-native'
import { Portal } from '@tamagui/portal'

const { width, height } = Dimensions.get('window')

const MessageOptionsPopover = ({
    isOpen,
    onClose,
    onRecall,
    onDelete,
    isMyMessage,
    isRecalled,
    children,
    message
}) => {
    const [isRecalling, setIsRecalling] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        if (isOpen) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 50,
                    duration: 150,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [isOpen]);

    const handleRecall = async () => {
        setIsRecalling(true);
        try {
            await onRecall();
        } finally {
            setIsRecalling(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete();
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCopy = async () => {
        try {
            const messageText = message?.message || '';
            if (messageText) {
                await Clipboard.setString(messageText);
            }
            onClose();
        } catch (error) {
            console.error('Error copying message:', error);
            onClose(); // Đảm bảo đóng popover ngay cả khi có lỗi
        }
    };

    return (
        <>
            <Popover open={isOpen} onOpenChange={onClose}>
                <Popover.Trigger>
                    <View
                        style={{
                            zIndex: isOpen ? 10000 : 0,
                            borderWidth: isOpen ? 2 : 0,
                            borderColor: isOpen ? '#FF7A1E' : 'transparent',    
                            borderRadius: 12,
                            backgroundColor: isOpen ? 'rgba(128,128,128,0.05)' : 'transparent',
                        }}
                    >
                        {children}
                    </View>
                </Popover.Trigger>
            </Popover>

            {isOpen && (
                <Portal >
                    <Animated.View
                        style={[
                            StyleSheet.absoluteFillObject,
                            {
                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                zIndex: 100,
                                opacity: fadeAnim,
                            },
                        ]}
                    >
                        <Pressable onPress={onClose} style={StyleSheet.absoluteFillObject} />
                    </Animated.View>

                    <Animated.View
                        style={{
                            position: 'absolute',
                            top: height / 2 - 120,
                            left: width / 2 - 130,
                            width: 260,
                            padding: 12,
                            backgroundColor: 'white',
                            borderRadius: 12,
                            zIndex: 101,
                            elevation: 5,
                            opacity: fadeAnim,
                            transform: [{ translateY }],
                        }}
                    >
                        <YStack space="$3">
                            {!isRecalled && <Button
                                size="$4"
                                onPress={handleCopy}
                                iconAfter={<Ionicons name="copy-outline" size={20} color="#9CA3AF"/>}
                                justifyContent="space-between"
                            >
                                Sao chép
                            </Button>}

                            {isMyMessage && !isRecalled && (
                                <Button
                                    size="$4"
                                    onPress={handleRecall}
                                    disabled={isRecalling}
                                    iconAfter={isRecalling ? 
                                        <ActivityIndicator size="small" color="#FF7A1E" /> : 
                                        <Ionicons name="refresh-outline" size={20} color="#EF4444"/>
                                    }
                                    justifyContent="space-between"
                                >
                                    {isRecalling ? 'Đang thu hồi tin nhắn...' : 'Thu hồi'}
                                </Button>
                            )}

                            <Button
                                size="$4"
                                onPress={handleDelete}
                                disabled={isDeleting}
                                iconAfter={isDeleting ? 
                                    <ActivityIndicator size="small" color="#FF7A1E" /> : 
                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                }
                                justifyContent="space-between"
                            >
                                {isDeleting ? 'Đang xoá...' : 'Xoá'}
                            </Button>

                            {!isRecalled && <Button
                                size="$4"
                                onPress={onClose}
                                iconAfter={<Ionicons name="arrow-redo-outline" size={20} color="#3B82F6"/>}
                                justifyContent="space-between"
                            >
                                Chuyển tiếp
                            </Button>}
                        </YStack>
                    </Animated.View>
                </Portal>
            )}
        </>
    )
}

export default MessageOptionsPopover
