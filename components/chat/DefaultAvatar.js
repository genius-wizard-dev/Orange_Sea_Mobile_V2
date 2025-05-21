import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image, Text } from 'tamagui';

const DefaultAvatar = ({ name, size }) => {
    // Lấy chữ cái đầu tiên và chuyển thành in hoa
    const firstLetter = name && typeof name === 'string'
        ? name.charAt(0).toUpperCase()
        : '?';

    return (
        <View style={[styles.defaultAvatar, { width: size, height: size }]}>
            <Text color="white" fontWeight="bold" fontSize={size * 0.4}>
                {firstLetter}
            </Text>
        </View>
    );
};

export default DefaultAvatar;

const styles = StyleSheet.create({
    defaultAvatar: {
        backgroundColor: '#888', // Nền xám
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 30,
    }
})