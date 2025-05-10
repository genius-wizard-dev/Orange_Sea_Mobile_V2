import { Popover, YStack, Button, View, Input } from 'tamagui'
import React, { useState, useEffect, useRef } from 'react'
import { Pressable, Dimensions, StyleSheet, ActivityIndicator, Animated, Alert } from 'react-native'
import { Portal } from '@tamagui/portal'

const { width, height } = Dimensions.get('window')

const EditNamePopover = ({
    isOpen,
    onClose,
    onSave,
    initialName,
    placeholderText = "Nhập tên mới",
    children
}) => {
    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        if (initialName) {
            setName(initialName);
        }
    }, [initialName]);

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

    const handleSave = async () => {
        if (name.trim() === '') {
            Alert.alert('Thông báo', 'Tên không được để trống');
            return;
        }
        
        if (name === initialName) {
            Alert.alert('Thông báo', 'Tên mới không được giống tên cũ');
            return;
        }

        setIsSaving(true);
        try {
            await onSave(name);
            onClose();
        } catch (error) {
            console.error('Lỗi khi lưu tên:', error);
            Alert.alert('Lỗi', 'Không thể đổi tên. Vui lòng thử lại sau.');
        } finally {
            setIsSaving(false);
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
                        }}
                    >
                        {children}
                    </View>
                </Popover.Trigger>
            </Popover>

            {isOpen && (
                <Portal>
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
                            top: height / 2 - 200,
                            left: width / 2 - 160,
                            width: 320,
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
                            <Input
                                size="$4"
                                value={name}
                                onChangeText={setName}
                                placeholder={placeholderText}
                                autoFocus
                            />
                            
                            <YStack flexDirection="row" justifyContent="space-between" marginTop="$2">
                                <Button
                                    size="$3" 
                                    flex={1}
                                    marginRight="$2"
                                    backgroundColor="#E5E7EB"
                                    color="#000"
                                    onPress={onClose}
                                >
                                    Huỷ
                                </Button>
                                <Button
                                    size="$3"
                                    flex={1}
                                    backgroundColor="#FF7A1E"
                                    color="#FFF"
                                    onPress={handleSave}
                                    disabled={isSaving || name.trim() === ''}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        'Lưu'
                                    )}
                                </Button>
                            </YStack>
                        </YStack>
                    </Animated.View>
                </Portal>
            )}
        </>
    );
};

export default EditNamePopover;
