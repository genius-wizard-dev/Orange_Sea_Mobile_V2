import React from 'react';
import { XStack, YStack, View } from 'tamagui';
import { StyleSheet } from 'react-native';
import SkeletonLoading from '../loading/SkeletonLoading';

const ChatItemSkeleton = () => {
    return (
        <XStack
            space="$3"
            marginBottom={10}
            paddingBottom={10}
            borderBottomWidth={1}
            borderColor="$gray5"
            alignItems="center"
        >
            {/* Skeleton cho Avatar */}
            <View style={styles.avatarContainer}>
                <SkeletonLoading width={50} height={50} borderRadius={25} />
            </View>

            {/* Skeleton cho nội dung bên phải */}
            <YStack flex={1} space="$2">
                {/* Skeleton cho tên */}
                <SkeletonLoading width={180} height={18} borderRadius={4} />

                {/* Skeleton cho tin nhắn */}
                <SkeletonLoading width={120} height={16} borderRadius={4} />
            </YStack>

            {/* Skeleton cho thời gian */}
            <SkeletonLoading width={40} height={12} borderRadius={4} />
        </XStack>
    );
};

const styles = StyleSheet.create({
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
    },
});

export default ChatItemSkeleton;