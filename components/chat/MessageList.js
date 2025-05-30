import React, { useEffect, useImperativeHandle, useRef, useLayoutEffect, useState, useCallback } from 'react';
import { View, FlatList, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import MessageItem from './MessageItem';
import { useDispatch } from 'react-redux';
import { setMessages } from '../../redux/slices/chatSlice';
import { fetchPaginatedMessages } from '../../redux/thunks/chat';
import MessageListSkeleton from '../loading/messages/MessageListSkeleton';
import { ImageBackground } from 'expo-image';

const MessageList = React.forwardRef(({
    messages,
    profileId,
    groupId,
    isLoading,
    nextCursor,
    setNextCursor,
    onLoadMoreMessages
}, ref) => {
    const dispatch = useDispatch();
    const flatListRef = useRef(null);
    const initialScroll = useRef(true);
    const cursor = useRef(null);
    const [forceUpdate, setForceUpdate] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    const [isRefreshing, setIsRefreshing] = useState(false);
    const loadingRef = useRef(false);

    const previousMessagesCountRef = useRef(0);
    const maintainScrollPositionRef = useRef(false);
    const scrollOffsetRef = useRef(0);
    const isLoadingMoreRef = useRef(false);

    useImperativeHandle(ref, () => ({
        scrollToEnd: () => {
            if (flatListRef.current) {
                flatListRef.current.scrollToOffset({ offset: 0, animated: true });
            }
        }
    }));

    const scrollToBottom = () => {
        if (flatListRef.current && messages?.length > 0) {
            flatListRef.current.scrollToOffset({ offset: 0, animated: !initialScroll.current });
            initialScroll.current = false;
        }
    };

    useLayoutEffect(() => {
        const timer = setTimeout(scrollToBottom, 200);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!maintainScrollPositionRef.current) {
            scrollToBottom();
        }
    }, [messages.length]);

    useEffect(() => {
        if (messages?.length > 0 && !isFirstLoad) {
            setForceUpdate(prev => prev + 1);
        }
    }, [messages.length, isFirstLoad]);

    useEffect(() => {
        if (isFirstLoad && messages?.length > 0) {
            setIsFirstLoad(false);
        }
    }, [messages.length]);


    useEffect(() => {
        const currentCount = messages.length;
        const previousCount = previousMessagesCountRef.current;

        console.log('=== MESSAGES COUNT CHANGED ===');
        console.log('Previous count:', previousCount);
        console.log('Current count:', currentCount);
        console.log('Is loading more:', isLoadingMoreRef.current);
        console.log('Maintain scroll position:', maintainScrollPositionRef.current);

        if (currentCount > previousCount) {
            const newMessagesCount = currentCount - previousCount;

            if (maintainScrollPositionRef.current && isLoadingMoreRef.current) {
                // SỬA: Load more - maintain scroll position
                console.log('Load more detected, maintaining scroll position');

                setTimeout(() => {
                    try {
                        const targetIndex = newMessagesCount;
                        flatListRef.current?.scrollToIndex({
                            index: targetIndex,
                            animated: false,
                            viewPosition: 0.1
                        });
                        console.log('Maintained scroll position at index:', targetIndex);
                    } catch (error) {
                        console.log('ScrollToIndex failed, using offset fallback');
                        const estimatedItemHeight = 80;
                        const offset = newMessagesCount * estimatedItemHeight;
                        flatListRef.current?.scrollToOffset({
                            offset: scrollOffsetRef.current + offset,
                            animated: false
                        });
                    }

                    maintainScrollPositionRef.current = false;
                    isLoadingMoreRef.current = false;
                }, 100);

            } else {
                // SỬA: Tin nhắn mới - scroll to bottom
                console.log('New message detected, scrolling to bottom');
                setTimeout(() => {
                    flatListRef.current?.scrollToOffset({
                        offset: 0,
                        animated: true
                    });
                }, 100);
            }
        }

        previousMessagesCountRef.current = currentCount;
    }, [messages.length]);




    const isSameDay = (date1, date2) => {
        if (!date1 || !date2) return false;
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const formatDateHeader = (date) => {
        const dateObj = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        // Kiểm tra nếu là hôm nay
        if (isSameDay(dateObj, today)) {
            return 'Hôm nay';
        }

        // Kiểm tra nếu là hôm qua
        if (isSameDay(dateObj, yesterday)) {
            return 'Hôm qua';
        }

        // Mapping thứ ngắn gọn
        const shortWeekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const weekday = shortWeekdays[dateObj.getDay()];

        const dateString = dateObj.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `${weekday}, ${dateString}`;
    };

    const renderMessage = ({ item, index }) => {
        // console.log(`Rendering message ${index}: ID=${item.id}, Content=${item.message}, CreatedAt=${item.createdAt}, isRecalled=${item.isRecalled}`);
        const isMyMessage = item.senderId === profileId;
        const prevMessage = index < messages.length - 1 ? messages[index + 1] : null;
        const showAvatar = !isMyMessage && (!prevMessage ||
            prevMessage.senderId !== item.senderId ||
            (new Date(item.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() > 60000)
        );
        const showDateHeader = !prevMessage || !isSameDay(item.createdAt, prevMessage.createdAt);

        return (
            <View>
                {showDateHeader && (
                    <View style={styles.dateHeaderContainer}>
                        <View style={styles.dateHeaderLineBorder} >
                            {/* <View style={styles.dateHeaderLine} /> */}
                            <Text style={styles.dateHeaderText}>
                                {formatDateHeader(item.createdAt)}
                            </Text>
                            {/* <View style={styles.dateHeaderLine} /> */}
                        </View>

                    </View>
                )}
                <MessageItem
                    key={`${item.id || item.tempId}_${forceUpdate}`}
                    msg={{ ...item, isMyMessage }}
                    isMyMessage={isMyMessage}
                    showAvatar={showAvatar}
                />
            </View>
        );
    };

    const loadMore = useCallback(async () => {
        // Kiểm tra điều kiện load more
        if (loadingRef.current || isLoadingMore || !nextCursor || !groupId) {
            console.log('Skip load more:', {
                loading: loadingRef.current,
                isLoadingMore,
                nextCursor,
                groupId
            });
            return;
        }

        console.log('=== LOAD MORE MESSAGES ===');
        console.log('Current nextCursor:', nextCursor);
        console.log('Current messages count:', messages.length);

        previousMessagesCountRef.current = messages.length;
        maintainScrollPositionRef.current = true;
        isLoadingMoreRef.current = true;

        loadingRef.current = true;
        setIsLoadingMore(true);

        try {
            const result = await dispatch(fetchPaginatedMessages({
                groupId,
                cursor: nextCursor // Sử dụng nextCursor hiện tại
            })).unwrap();

            console.log('Load more result:', result);

            if (result?.statusCode === 200 && result.data?.messages?.length > 0) {



                const formattedMessages = result.data.messages.map(msg => {


                    console.log('\n=== MAPPING MESSAGE ===');
                    console.log('Original message ID:', msg.id);
                    console.log('Original message type:', msg.type);
                    console.log('Original message keys:', Object.keys(msg));

                    // SỬA: Debug tất cả content fields
                    console.log('Content fields check:');
                    console.log('  msg.content:', `"${msg.content}"`, typeof msg.content);
                    console.log('  msg.message:', `"${msg.message}"`, typeof msg.message);
                    console.log('  msg.text:', `"${msg.text}"`, typeof msg.text);
                    console.log('  msg.body:', `"${msg.body}"`, typeof msg.body);
                    console.log('  msg.data:', `"${msg.data}"`, typeof msg.data);


                    const imageUrl = msg.fileUrl ||
                        msg.imageUrl ||
                        msg.url ||
                        msg.image ||
                        msg.attachmentUrl ||
                        msg.file ||
                        msg.media ||
                        msg.src ||
                        msg.path ||
                        msg.link;

                    const messageContent = msg.content ||
                        msg.message ||
                        msg.text ||
                        msg.body ||
                        msg.data ||
                        '';

                    console.log('Final messageContent:', `"${messageContent}"`);
                    console.log('Is messageContent empty?', messageContent === '');
                    console.log('MessageContent length:', messageContent.length);




                    const formattedMessage = {
                        id: msg.id,
                        message: messageContent,
                        senderId: msg.senderId,
                        groupId: msg.groupId,
                        createdAt: msg.createdAt,
                        updatedAt: msg.updatedAt,
                        type: msg.type,
                        imageUrl: imageUrl,
                        fileName: msg.fileName,
                        fileSize: msg.fileSize,
                        isRecalled: msg.isRecalled,
                        sender: msg.sender,
                        isMyMessage: msg.senderId === profileId,
                        originalContent: msg.originalContent,
                        isPending: false
                    };

                    console.log('=== FINAL FORMATTED MESSAGE ===');
                    console.log('Formatted ID:', formattedMessage.id);
                    console.log('Formatted type:', formattedMessage.type);
                    console.log('Formatted message:', `"${formattedMessage.message}"`);

                    return formattedMessage;
                });

                const newNextCursor = result.data.nextCursor;

                console.log('=== CURSOR CHECK ===');
                console.log('Old cursor:', nextCursor);
                console.log('New cursor:', newNextCursor);
                console.log('Cursors are equal:', nextCursor === newNextCursor);

                if (!newNextCursor || newNextCursor === nextCursor) {
                    console.log('No more messages or cursor unchanged - stopping load more');
                    setNextCursor(null); // Dừng load more
                    maintainScrollPositionRef.current = false;
                    isLoadingMoreRef.current = false;
                    return; // Thoát sớm, không gọi onLoadMoreMessages
                }

                // Gọi callback để cập nhật messages và nextCursor
                onLoadMoreMessages({
                    messages: formattedMessages,
                    nextCursor: newNextCursor
                });

                // Cập nhật nextCursor cho lần load tiếp theo
                setNextCursor(newNextCursor);
                console.log('Updated nextCursor:', newNextCursor);
                console.log('New messages loaded:', formattedMessages.length);
            } else {
                console.log('No more messages to load');
                setNextCursor(null); // Không còn tin nhắn để load
                maintainScrollPositionRef.current = false;
                isLoadingMoreRef.current = false;
            }
        } catch (error) {
            console.error('Error loading more messages:', error);
            maintainScrollPositionRef.current = false;
            isLoadingMoreRef.current = false;
        } finally {
            loadingRef.current = false;
            setIsLoadingMore(false);
        }
    }, [dispatch, groupId, nextCursor, messages.length, profileId, onLoadMoreMessages, setNextCursor, isLoadingMore]);


    const handleScroll = useCallback((event) => {
        scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
    }, []);

    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const result = await dispatch(fetchPaginatedMessages({
                groupId,
                cursor: null // Reset cursor để load từ đầu
            })).unwrap();

            if (result?.statusCode === 200 && result.data?.messages?.length > 0) {
                const formattedMessages = result.data.messages.map(msg => ({
                    id: msg.id,
                    message: msg.content,
                    senderId: msg.senderId,
                    groupId: msg.groupId,
                    createdAt: msg.createdAt,
                    updatedAt: msg.updatedAt,
                    type: msg.type,
                    imageUrl: msg.fileUrl || msg.imageUrl,
                    fileName: msg.fileName,
                    fileSize: msg.fileSize,
                    isRecalled: msg.isRecalled,
                    sender: msg.sender,
                    isMyMessage: msg.senderId === profileId,
                    originalContent: msg.originalContent,
                    isPending: false
                }));

                onLoadMoreMessages({
                    messages: formattedMessages,
                    nextCursor: result.data.nextCursor,
                    refresh: true // Flag để replace thay vì append
                });

                setNextCursor(result.data.nextCursor);
            }
        } catch (error) {
            console.error('Error refreshing messages:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, [dispatch, groupId, profileId, onLoadMoreMessages, setNextCursor]);


    // Render loading indicator ở đầu danh sách
    const renderLoadMoreIndicator = () => {
        if (!isLoadingMore) return null;

        return (
            <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#FF7A1E" />
                <Text fontSize={12} color="#666" marginTop={8}>
                    Đang tải tin nhắn cũ...
                </Text>
            </View>
        );
    };

    const renderEmptyComponent = () => (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text fontSize={16} color="#666" textAlign="center">
                Chưa có tin nhắn nào
            </Text>
            <Text fontSize={14} color="#999" textAlign="center" marginTop={8}>
                Hãy bắt đầu cuộc trò chuyện!
            </Text>
        </View>
    );


    if (isLoading) {
        return <MessageListSkeleton />;
    }

    return (

        <ImageBackground
            source={require('../../assets/bgr_mess.jpg')}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={({ item, index }) => renderMessage({ item, index })}
                keyExtractor={item => `${item.id || item.tempId}_${forceUpdate}`}
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                inverted={true}
                maintainVisibleContentPosition={{
                    minIndexForVisible: 0,
                    autoscrollToTopThreshold: 50
                }}
                onEndReached={loadMore}
                onEndReachedThreshold={0.05}
                ListFooterComponent={renderLoadMoreIndicator}
                ListEmptyComponent={renderEmptyComponent}
                extraData={forceUpdate}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        tintColor="#FF7A1E"
                        colors={['#FF7A1E']}
                    />
                }
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                initialNumToRender={20}
                windowSize={5}
                scrollEventThrottle={100}
                onScroll={handleScroll}
                onMomentumScrollBegin={() => {
                    // Reset loading ref khi user bắt đầu scroll
                    if (!isLoadingMore) {
                        loadingRef.current = false;
                    }
                }}
                onScrollToIndexFailed={(info) => {
                    console.log('ScrollToIndex failed:', info);
                    setTimeout(() => {
                        try {
                            flatListRef.current?.scrollToIndex({
                                index: Math.min(info.index, messages.length - 1),
                                animated: false,
                                viewPosition: 0.1
                            });
                        } catch (error) {
                            // Final fallback
                            flatListRef.current?.scrollToOffset({
                                offset: info.averageItemLength * info.index,
                                animated: false
                            });
                        }
                    }, 100);
                }}
            />
        </ImageBackground>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 70,
        paddingBottom: 80,
    },
    contentContainer: {
        flexGrow: 1,
        paddingBottom: 20,
        paddingTop: 10,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
        paddingHorizontal: 20,
        zIndex: 1
    },
    dateHeaderLineBorder: {
        backgroundColor: '#918787',
        width: "150",
        textAlign: 'center',
        borderRadius: 20,

    },
    dateHeaderLine: {
        flex: 1,
        // height: 1,
        // backgroundColor: '#E5E5E5'
    },
    dateHeaderText: {
        color: '#fff',
        fontSize: 12,
        marginHorizontal: 20,
        padding: 3,
        fontWeight: '500',
        textAlign: 'center',
    },
    loadingMore: {
        padding: 10,
        alignItems: 'center'
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
    }
});

export default MessageList;