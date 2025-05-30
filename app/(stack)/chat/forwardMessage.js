import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, FlatList, TextInput, View, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { Text, YStack, XStack, Separator, Button } from 'tamagui';
import { useSelector, useDispatch } from 'react-redux';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getListGroup } from '../../../redux/thunks/group';
import { forwardMessage } from '../../../redux/thunks/chat';
// import { Avatar } from '../../../components/ui/Avatar';
import { Video } from 'expo-av';
import GroupAvatar from '../../../components/group/GroupAvatar';

const ForwardMessageScreen = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const [isVideoPlaying, setIsVideoPlaying] = useState(false);

    const router = useRouter();
    const dispatch = useDispatch();
    const { messageId, messageContent, messageType, senderId, imageUrl, fileName, fileSize } = useLocalSearchParams();

    const { profile } = useSelector((state) => state.profile);
    const groups = useSelector(state => state.group.groups || []);
    const profiles = useSelector(state => state.profile.profiles || {});

    const senderInfo = useMemo(() => {
        return profiles[senderId] || {};
    }, [profiles, senderId]);

    // console.log("groups from state:", groups);

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        setIsLoading(true);
        try {
            await dispatch(getListGroup());
        } catch (error) {
            console.error('Lỗi khi tải danh sách nhóm:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const limitText = (text, maxLength) => {
        if (!text) return '';
        return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    };

    const filteredGroups = useMemo(() => {
        if (!groups || !Array.isArray(groups)) return [];

        return groups.filter(group => {
            // Nếu không có từ khóa tìm kiếm, hiển thị tất cả nhóm
            if (!searchQuery) return true;

            // Xác định tên hiển thị của nhóm/trò chuyện
            let displayName = '';

            // Nếu là nhóm chat
            if (group.isGroup) {
                displayName = group.name || '?';
            }
            // Nếu là chat cá nhân
            else {
                const otherParticipant = group.participants?.find(p => p?.profileId !== profile?.id);
                displayName = otherParticipant?.name || '?';
            }

            return displayName.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [groups, searchQuery, profile?.id]);

    const toggleGroupSelection = (groupId) => {
        if (selectedGroups.includes(groupId)) {
            setSelectedGroups(selectedGroups.filter(id => id !== groupId));
        } else {
            setSelectedGroups([...selectedGroups, groupId]);
        }
    };

    const handleForward = async () => {
        if (selectedGroups.length === 0) {
            Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một nhóm để chuyển tiếp tin nhắn');
            return;
        }

        setIsSending(true);
        try {
            // Gửi tin nhắn đến từng nhóm đã chọn
            const forwardPromises = selectedGroups.map(groupId =>
                dispatch(forwardMessage({ messageId, groupId: groupId }))
            );

            await Promise.all(forwardPromises);

            Alert.alert(
                'Thành công',
                'Đã chuyển tiếp tin nhắn đến các nhóm đã chọn',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error) {
            console.error('Lỗi khi chuyển tiếp tin nhắn:', error);
            Alert.alert('Lỗi', 'Không thể chuyển tiếp tin nhắn. Vui lòng thử lại sau.');
        } finally {
            setIsSending(false);
        }
    };

    const handleVideoPress = () => {
        setIsVideoPlaying(prev => !prev);
    };

    const renderMessagePreview = () => {
        return (
            <View style={styles.messagePreviewContainer}>
                <Text style={styles.previewLabel}>Tin nhắn chuyển tiếp:</Text>

                <View style={styles.messageBubble}>
                    {/* {senderInfo && (
                        <XStack space="$2" alignItems="center" marginBottom="$2">
                            <View style={styles.senderAvatar}>
                                <Text color="#FFFFFF" fontWeight="bold">
                                    {(senderInfo.firstName || 'U').charAt(0)}
                                </Text>
                            </View>
                            <Text fontSize={14} color="#666666">
                                {senderInfo.firstName} {senderInfo.lastName}
                            </Text>
                        </XStack>
                    )} */}

                    <XStack space="$3" alignItems="center">
                        {/* Hiển thị ảnh thu nhỏ hoặc video */}
                        {messageType === 'IMAGE' && imageUrl ? (
                            <Image
                                source={{ uri: imageUrl }}
                                style={styles.thumbnailImage}
                                resizeMode="cover"
                            />
                        ) : messageType === 'VIDEO' && imageUrl ? (
                            <Video
                                source={{ uri: imageUrl }}
                                style={styles.thumbnailVideo}
                                useNativeControls
                                resizeMode="contain"
                                shouldPlay
                            // onPlaybackStatusUpdate={ didJustFinish }
                            />
                        ) : messageType === 'RAW' ? (
                            <View style={styles.fileIconContainer}>
                                <Ionicons name="document-outline" size={24} color="#525ec9" />
                            </View>
                        ) : null}

                        <YStack flex={1}>
                            {/* Hiển thị nhãn loại tin nhắn */}
                            {messageType === 'IMAGE' && (
                                <Text style={styles.fileTypeLabel}>[Hình ảnh]</Text>
                            )}
                            {messageType === 'VIDEO' && (
                                <Text style={styles.fileTypeLabel}>[Video]</Text>
                            )}
                            {messageType === 'RAW' && (
                                <YStack>
                                    <Text
                                        style={styles.fileName}
                                        numberOfLines={1}
                                        ellipsizeMode="middle"
                                    >
                                        {fileName || "Tài liệu"}
                                    </Text>
                                    {fileSize && (
                                        <Text style={styles.fileSize}>
                                            {`${Math.round(fileSize / 1024)} KB`}
                                        </Text>
                                    )}
                                </YStack>
                            )}

                            {/* Hiển thị nội dung tin nhắn nếu không phải media */}
                            {(messageType !== 'IMAGE' && messageType !== 'VIDEO' && messageType !== 'RAW') && (
                                <Text style={styles.messageText}>{messageContent}</Text>
                            )}
                        </YStack>
                    </XStack>
                </View>
            </View>
        );
    };

    const renderGroupItem = ({ item }) => {
        // Xác định tên hiển thị của nhóm/trò chuyện
        let displayName = '';

        // Nếu là nhóm chat
        if (item.isGroup) {
            displayName = limitText(item.name || 'Nhóm chat', 25);
        }
        // Nếu là chat cá nhân
        else {
            const otherParticipant = item.participants?.find(p => p?.profileId !== profile?.id);
            displayName = limitText(otherParticipant?.name || 'Loading...', 25);
        }

        return (
            <TouchableOpacity
                style={styles.groupItem}
                onPress={() => toggleGroupSelection(item.id)}
                activeOpacity={0.7}
            >
                <XStack space="$3" alignItems="center" flex={1}>
                    {/* Tạo avatar đơn giản */}
                    <View style={styles.avatarPlaceholder}>
                        <Text color="#FFFFFF" fontWeight="bold">
                            {displayName.charAt(0).toUpperCase()}
                        </Text>
                        <GroupAvatar
                            group={item}
                            size={40}
                            isGroup={item.isGroup}
                            userId={profile?.id}
                        />
                    </View>
                    <View>
                        <Text style={styles.groupName} numberOfLines={1}>{displayName}</Text>
                        {item.isGroup && item.participants && (
                            <Text style={styles.memberCount}>
                                {item.participants.length} thành viên
                            </Text>
                        )}
                    </View>
                </XStack>
                <View style={[
                    styles.checkbox,
                    selectedGroups.includes(item.id) && styles.checkboxSelected
                ]}>
                    {selectedGroups.includes(item.id) && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <YStack flex={1} backgroundColor="#FFFFFF">
            {/* Header */}
            <XStack
                height={56}
                alignItems="center"
                paddingHorizontal="$4"
                backgroundColor="#FFFFFF"
                borderBottomWidth={1}
                borderBottomColor="#EEEEEE"
            >
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                    <Ionicons name="arrow-back" size={24} color="#000000" />
                </TouchableOpacity>
                <Text fontSize={18} fontWeight="600" flex={1}>Chia sẻ</Text>
                <Button
                    onPress={handleForward}
                    disabled={selectedGroups.length === 0 || isSending}
                    backgroundColor={selectedGroups.length > 0 ? "#FF7A1E" : "#CCCCCC"}
                    color="#FFFFFF"
                    borderRadius={8}
                    padding="$2"
                >
                    {isSending ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Text color="#FFFFFF">Gửi ({selectedGroups.length})</Text>
                    )}
                </Button>
            </XStack>

            {/* Search Input */}
            <XStack padding="$3" backgroundColor="#F5F5F5">
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#999999" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm nhóm chat"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#999999" />
                        </TouchableOpacity>
                    )}
                </View>
            </XStack>

            {/* Message preview */}
            {renderMessagePreview()}

            <Separator marginVertical="$2" />

            <Text paddingHorizontal="$3" paddingVertical="$2" fontWeight="600">
                Chia sẻ với ({selectedGroups.length}) người/nhóm :
            </Text>

            {/* Group List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF7A1E" />
                    <Text marginTop="$2" color="#666666">Đang tải danh sách nhóm...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredGroups}
                    renderItem={renderGroupItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubble-ellipses-outline" size={48} color="#CCCCCC" />
                            <Text marginTop="$2" color="#666666">
                                {searchQuery ?
                                    'Không tìm thấy nhóm nào' :
                                    'Bạn chưa có nhóm chat nào'}
                            </Text>
                        </View>
                    }
                />
            )}
        </YStack>
    );
};

export default ForwardMessageScreen;

const styles = StyleSheet.create({
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 40,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    messagePreviewContainer: {
        padding: 12,
        backgroundColor: '#F9F9F9',
    },
    previewLabel: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 8,
    },
    messageBubble: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    messageText: {
        fontSize: 16,
        color: '#333333',
    },
    previewImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
    },
    listContainer: {
        paddingBottom: 20,
    },
    groupItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    groupName: {
        fontSize: 17,
        flex: 1,
        position: 'relative',
        top:10,
        fontWeight: '600',
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#CCCCCC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#FF7A1E',
        borderColor: '#FF7A1E',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    thumbnailImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#F0F0F0'
    },
    fileTypeLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333333',
        marginBottom: 4
    },
    senderAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FF7A1E',
        alignItems: 'center',
        justifyContent: 'center'
    },
    thumbnailVideo: {
        width: 80,
        height: 80,
        borderRadius: 8
    },
    fileName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333333',
        marginBottom: 2
    },
    fileSize: {
        fontSize: 12,
        color: '#888888', // màu mờ hơn
        fontStyle: 'italic'
    },
    fileIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
        justifyContent: 'center'
    },
    memberCount: {
        fontSize: 12,
        color: '#888888',
        marginTop: 2
    },
  
});