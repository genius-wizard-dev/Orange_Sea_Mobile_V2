import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { Image, Text } from 'tamagui';

const GroupAvatar = ({ group, size = 50 }) => {
    const participants = group.participants || [];
    const memberCount = participants.length;
    const { profile } = useSelector(state => state.profile);

    if (!group.isGroup) {
        // Single user chat - show single avatar
        const otherParticipant = participants.find(p => p?.userId !== profile?.id);
        return (
            <View style={[styles.singleContainer, { width: size, height: size }]}>
                <Image
                    source={{ uri: otherParticipant?.user?.avatar || 'https://i.ibb.co/jvVzkvBm/bgr-default.png' }}
                    style={[styles.singleAvatar, { width: size, height: size }]}
                />
            </View>
        );
    }

    // Group chat
    const smallAvatarSize = size * 0.6;
    const visibleParticipants = participants.slice(0, 2);

    return (
        <View style={[styles.groupContainer, { width: size, height: size }]}>
            {memberCount === 1 ? (
                // One member
                <Image
                    source={{ uri: participants[0]?.user?.avatar || 'https://i.ibb.co/jvVzkvBm/bgr-default.png' }}
                    style={[styles.singleAvatar, { width: size, height: size }]}
                />
            ) : memberCount === 2 ? (
                // Two members - show both avatars
                <>
                    <Image
                        source={{ uri: participants[0]?.user?.avatar }}
                        style={[styles.doubleAvatar, { width: smallAvatarSize, height: smallAvatarSize }]}
                    />
                    <Image
                        source={{ uri: participants[1]?.user?.avatar }}
                        style={[styles.doubleAvatar, { width: smallAvatarSize, height: smallAvatarSize }]}
                    />
                    <View style={styles.memberCount}>
                        <Text color="white" fontSize={10}>
                            {memberCount < 9 ? memberCount : '9+'}
                        </Text>
                    </View>
                </>
            ) : (
                // Three or more members
                <>
                    {visibleParticipants.map((participant, index) => (
                        <Image
                            key={participant.id}
                            source={{ uri: participant.user?.avatar }}
                            style={[
                                styles.multiAvatar,
                                {
                                    width: smallAvatarSize,
                                    height: smallAvatarSize,
                                    left: index * (smallAvatarSize / 2)
                                }
                            ]}
                        />
                    ))}
                    <View style={styles.memberCount}>
                        <Text color="white" fontSize={10}>
                            {memberCount}
                        </Text>
                    </View>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    groupContainer: {
        position: 'relative',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    singleContainer: {
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#eaeaea',
    },
    singleAvatar: {
        borderRadius: 30,
    },
    doubleAvatar: {
        borderRadius: 20,
        margin: 2,
    },
    multiAvatar: {
        position: 'absolute',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#eaeaea',
    },
    memberCount: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#666',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    }
});

export default GroupAvatar;