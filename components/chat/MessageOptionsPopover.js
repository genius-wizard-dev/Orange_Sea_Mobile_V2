import { Popover, YStack, Button, View } from 'tamagui'
import React, { useState, useEffect, useRef } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Pressable, Dimensions, StyleSheet, ActivityIndicator, Animated } from 'react-native'
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
                            backgroundColor: isOpen ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                        }}
                    >
                        {children}
                    </View>
                </Popover.Trigger>
            </Popover>

            {/* Portal để overlay và popover content luôn nằm top */}
            {isOpen && (
                <Portal>
                    {/* Overlay */}
                    <Animated.View
                        style={[
                            StyleSheet.absoluteFillObject,
                            {
                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                zIndex: 100,
                                opacity: fadeAnim,
                            },
                        ]}
                    >
                        <Pressable onPress={onClose} style={StyleSheet.absoluteFillObject} />
                    </Animated.View>

                    {/* Popover content */}
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
                                size="$3"
                                onPress={onClose}
                                iconAfter={<Ionicons name="copy-outline" size={18} />}
                                justifyContent="space-between"
                            >
                                Sao chép
                            </Button>}

                            {isMyMessage && !isRecalled && (
                                <Button
                                    size="$3"
                                    onPress={handleRecall}
                                    disabled={isRecalling}
                                    iconAfter={isRecalling ? 
                                        <ActivityIndicator size="small" color="#FF7A1E" /> : 
                                        <Ionicons name="refresh-outline" size={18} />
                                    }
                                    justifyContent="space-between"
                                >
                                    {isRecalling ? 'Đang thu hồi tin nhắn...' : 'Thu hồi'}
                                </Button>
                            )}

                            <Button
                                size="$3"
                                onPress={handleDelete}
                                disabled={isDeleting}
                                iconAfter={isDeleting ? 
                                    <ActivityIndicator size="small" color="#FF7A1E" /> : 
                                    <Ionicons name="trash-outline" size={18} />
                                }
                                justifyContent="space-between"
                            >
                                {isDeleting ? 'Đang xoá...' : 'Xoá'}
                            </Button>

                            {!isRecalled && <Button
                                size="$3"
                                onPress={onClose}
                                iconAfter={<Ionicons name="arrow-redo-outline" size={18} />}
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
