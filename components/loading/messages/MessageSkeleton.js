import React from 'react';
import { View } from 'tamagui';
import { StyleSheet } from 'react-native';
import SkeletonLoading from '../SkeletonLoading';

const MessageSkeleton = ({ isMyMessage = false }) => {
    return (
        <View style={[
            styles.container,
            isMyMessage ? styles.myMessage : styles.otherMessage
        ]}>
            {!isMyMessage && (
                <View style={styles.avatarContainer}>
                    <SkeletonLoading
                        width={30}
                        height={30}
                        borderRadius={15}
                    />
                </View>
            )}
            <View style={[
                styles.messageContainer,
                isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
            ]}>
                {!isMyMessage && (
                    <SkeletonLoading
                        width={80}
                        height={14}
                        borderRadius={4}
                        style={styles.nameText}
                    />
                )}
                <View style={styles.bubbleContainer}>
                    <SkeletonLoading
                        width={isMyMessage ? 160 : 180}
                        height={45}
                        borderRadius={16}
                        style={isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble}
                    />
                </View>
                <SkeletonLoading
                    width={40}
                    height={10}
                    borderRadius={4}
                    style={[
                        styles.timestamp,
                        isMyMessage ? styles.myTimestamp : styles.otherTimestamp
                    ]}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginVertical: 8,
        paddingHorizontal: 16,
        maxWidth: '90%',
    },
    myMessage: {
        alignSelf: 'flex-end',
        marginLeft: 'auto',
    },
    otherMessage: {
        alignSelf: 'flex-start',
        marginRight: 'auto',
    },
    avatarContainer: {
        marginRight: 8,
        alignSelf: 'flex-end',
    },
    messageContainer: {
        maxWidth: '80%',
    },
    myMessageContainer: {
        alignItems: 'flex-end',
    },
    otherMessageContainer: {
        alignItems: 'flex-start',
    },
    nameText: {
        marginBottom: 4,
    },
    bubbleContainer: {
        marginVertical: 4,
    },
    myMessageBubble: {
        backgroundColor: '#e5ad87',
    },
    otherMessageBubble: {
        backgroundColor: '#F5F5F5',
    },
    timestamp: {
        marginTop: 2,
    },
    myTimestamp: {
        alignSelf: 'flex-end',
    },
    otherTimestamp: {
        alignSelf: 'flex-start',
    },
});

export default MessageSkeleton;