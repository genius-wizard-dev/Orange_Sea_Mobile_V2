import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Image, TouchableOpacity,
    Dimensions, ActivityIndicator
} from 'react-native';
import { Text, YStack, XStack, Tabs } from 'tamagui';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGroupImages, fetchGroupVideos, fetchGroupFiles } from '../../../redux/thunks/chat';
import HeaderNavigation from '../../../components/header/HeaderNavigation';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Video } from 'expo-av';
import { setGroupMedia } from '../../../redux/slices/chatSlice';
import ImageViewer from '../../../components/chat/ImageViewer';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width / 3;
const SPACING = 2;

const ManageMedia = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const dispatch = useDispatch();

    const { groupId, groupName } = route.params || {};
    const [activeTab, setActiveTab] = useState('IMAGE');
    const [refreshing, setRefreshing] = useState(false);
    const [playingVideoId, setPlayingVideoId] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageViewerVisible, setImageViewerVisible] = useState(false);

    // Lấy danh sách media từ Redux store
    const groupMedia = useSelector(state => state.chat.groupMedia[groupId] || {});
    const media = groupMedia[activeTab] || [];
    const loading = useSelector(state => state.chat.loading);

    // Dừng video khi chuyển tab
    useEffect(() => {
        setPlayingVideoId(null);
    }, [activeTab]);

    // Fetch data lần đầu khi mount component
    useEffect(() => {
        if (groupId) {
            loadCurrentTabData();
        }
    }, [groupId]);

    // Hàm fetch dữ liệu cho tab hiện tại
    const loadCurrentTabData = useCallback(() => {
        if (!groupId) return;

        setRefreshing(true);

        // Reset dữ liệu trước khi tải
        dispatch(setGroupMedia({
            groupId,
            mediaType: activeTab,
            data: { media: [], nextCursor: null, hasMore: false }
        }));

        // Gọi thunk tương ứng dựa trên tab hiện tại
        try {
            if (activeTab === 'IMAGE') {
                dispatch(fetchGroupImages({ groupId, limit: 20 }));
            } else if (activeTab === 'VIDEO') {
                dispatch(fetchGroupVideos({ groupId, limit: 20 }));
            } else if (activeTab === 'RAW') {
                dispatch(fetchGroupFiles({ groupId, limit: 20 }));
            }
        } catch (error) {
            console.error(`Error loading ${activeTab} media:`, error);
        } finally {
            setRefreshing(false);
        }
    }, [groupId, activeTab, dispatch]);

    // Handler khi người dùng thực hiện refresh
    const handleRefresh = useCallback(() => {
        loadCurrentTabData();
    }, [loadCurrentTabData]);

    // Handler khi chuyển tab
    const handleTabChange = useCallback((newTab) => {
        console.log(`Tab changed from ${activeTab} to ${newTab}`);

        if (activeTab !== newTab) {
            setActiveTab(newTab);

            // Đặt media về mảng rỗng ngay lập tức
            dispatch(setGroupMedia({
                groupId,
                mediaType: newTab,
                data: { media: [], nextCursor: null, hasMore: false }
            }));

            // Gọi API tương ứng với tab mới
            setTimeout(() => {
                setRefreshing(true);

                if (newTab === 'IMAGE') {
                    dispatch(fetchGroupImages({ groupId, limit: 20 }))
                        .finally(() => setRefreshing(false));
                } else if (newTab === 'VIDEO') {
                    dispatch(fetchGroupVideos({ groupId, limit: 20 }))
                        .finally(() => setRefreshing(false));
                } else if (newTab === 'RAW') {
                    dispatch(fetchGroupFiles({ groupId, limit: 20 }))
                        .finally(() => setRefreshing(false));
                }
            }, 10);
        }
    }, [activeTab, groupId, dispatch]);

    // Handler khi bấm vào video
    const handleVideoPress = (videoId) => {
        setPlayingVideoId(playingVideoId === videoId ? null : videoId);
    };

    // Handler khi xem chi tiết media
    const handleViewMedia = (item) => {
        console.log('View media:', item);

        if (activeTab === 'IMAGE') {
            // Mở ImageViewer với ảnh đã chọn
            setSelectedImage(item.fileUrl);
            setImageViewerVisible(true);
        } else if (activeTab === 'VIDEO') {
            // Phát video
            handleVideoPress(item.id);
        } else if (activeTab === 'RAW') {
            // Xử lý file (có thể thêm logic xem trước hoặc tải xuống)
            console.log('Open file:', item.fileUrl);
        }
    };

    const handleCloseImageViewer = () => {
        setImageViewerVisible(false);
        setSelectedImage(null);
    };

    // Render từng item media
    const renderMediaItem = ({ item }) => {
        if (!item) return null;

        switch (activeTab) {
            case 'IMAGE':
                return (
                    <TouchableOpacity
                        style={styles.mediaItem}
                        onPress={() => handleViewMedia(item)}
                    >
                        <Image
                            source={{ uri: item.fileUrl }}
                            style={styles.mediaImage}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                );

            case 'VIDEO':
                const isPlaying = playingVideoId === item.id;
                return (
                    <TouchableOpacity
                        style={styles.mediaItem}
                        onPress={() => handleVideoPress(item.id)}
                    >

                        <Video
                            source={{ uri: item.fileUrl }}
                            style={{ width: '100%', height: '100%' }}
                            useNativeControls
                            resizeMode="cover"
                        // onPlaybackStatusUpdate={(status) => {
                        //     if (status.didJustFinish) {
                        //         setPlayingVideoId(null);
                        //     }
                        // }}
                        />
                    </TouchableOpacity>
                );

            case 'RAW':
                return (
                    <TouchableOpacity
                        style={styles.fileItem}
                        onPress={() => handleViewMedia(item)}
                    >
                        <View style={styles.fileIconContainer}>
                            <MaterialIcons name="insert-drive-file" size={28} color="#4285F4" />
                        </View>
                        <YStack space="$1" flex={1} paddingLeft="$2">
                            <Text numberOfLines={1} ellipsizeMode="middle" fontSize="$3">
                                {item.fileName || 'File'}
                            </Text>
                            <Text color="#888" fontSize="$2">
                                {item.fileSize ? `${Math.round(parseInt(item.fileSize) / 1024)} KB` : ''}
                            </Text>
                        </YStack>
                    </TouchableOpacity>
                );

            default:
                return null;
        }
    };

    // Render empty state
    const renderEmptyComponent = () => (
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$6" height={300}>
            {refreshing ? (
                <ActivityIndicator size="large" color="#FF7A1E" />
            ) : (
                <>
                    <Ionicons
                        name={activeTab === 'IMAGE' ? 'images-outline' :
                            activeTab === 'VIDEO' ? 'videocam-outline' : 'document-outline'}
                        size={50}
                        color="#ccc"
                    />
                    <Text color="#888" fontSize="$4" marginTop="$4" textAlign="center">
                        {`Không có ${activeTab === 'IMAGE' ? 'hình ảnh' :
                            activeTab === 'VIDEO' ? 'video' : 'tài liệu'} nào trong nhóm chat này`}
                    </Text>
                </>
            )}
        </YStack>
    );

    return (
        <YStack flex={1} backgroundColor="white">
            <HeaderNavigation title={`Media của ${groupName || 'nhóm'}`} />

            <Tabs
                defaultValue="IMAGE"
                value={activeTab}
                onValueChange={handleTabChange}
                orientation="horizontal"
                flexDirection="column"
                flex={1}
            >
                <Tabs.List backgroundColor="white" borderBottomWidth={1} borderBottomColor="#eee">
                    <Tabs.Tab value="IMAGE" flex={1}>
                        <Text fontSize="$4" fontWeight={activeTab === 'IMAGE' ? '600' : '400'}>
                            Hình ảnh
                        </Text>
                    </Tabs.Tab>
                    <Tabs.Tab value="VIDEO" flex={1}>
                        <Text fontSize="$4" fontWeight={activeTab === 'VIDEO' ? '600' : '400'}>
                            Video
                        </Text>
                    </Tabs.Tab>
                    <Tabs.Tab value="RAW" flex={1}>
                        <Text fontSize="$4" fontWeight={activeTab === 'RAW' ? '600' : '400'}>
                            File
                        </Text>
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Content value="IMAGE" flex={1}>
                    <FlashList
                        data={media}
                        renderItem={renderMediaItem}
                        estimatedItemSize={ITEM_WIDTH}
                        numColumns={3}
                        onRefresh={handleRefresh}
                        refreshing={refreshing}
                        ListEmptyComponent={renderEmptyComponent}
                        contentContainerStyle={styles.listContent}
                    />
                </Tabs.Content>

                <Tabs.Content value="VIDEO" flex={1}>
                    <FlashList
                        data={media}
                        renderItem={renderMediaItem}
                        estimatedItemSize={ITEM_WIDTH}
                        numColumns={3}
                        onRefresh={handleRefresh}
                        refreshing={refreshing}
                        ListEmptyComponent={renderEmptyComponent}
                        contentContainerStyle={styles.listContent}
                    />
                </Tabs.Content>

                <Tabs.Content value="RAW" flex={1}>
                    <FlashList
                        data={media}
                        renderItem={renderMediaItem}
                        estimatedItemSize={70}
                        onRefresh={handleRefresh}
                        refreshing={refreshing}
                        ListEmptyComponent={renderEmptyComponent}
                        contentContainerStyle={styles.listContent}
                    />
                </Tabs.Content>
            </Tabs>
            <ImageViewer
                visible={imageViewerVisible}
                imageUri={selectedImage}
                onClose={handleCloseImageViewer}
            />
        </YStack>
    );
};

export default ManageMedia;

const styles = StyleSheet.create({
    listContent: {
        padding: SPACING,
        flexGrow: 1,
    },
    mediaItem: {
        width: ITEM_WIDTH - SPACING * 2,
        height: ITEM_WIDTH - SPACING * 2,
        margin: SPACING,
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    mediaImage: {
        width: '100%',
        height: '100%',
    },
    videoPlayIcon: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    fileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    fileIconContainer: {
        width: 42,
        height: 42,
        borderRadius: 4,
        backgroundColor: '#f1f3f4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerLoader: {
        padding: 16,
        alignItems: 'center',
    }
});