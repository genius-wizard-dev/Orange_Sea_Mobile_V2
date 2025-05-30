import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, FlatList, Image, Alert, Modal, Animated, Dimensions, ToastAndroid } from 'react-native';
import { View, Text, XStack, YStack, Separator, Tabs, Button, Sheet,Spinner } from 'tamagui';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { getGroupDetail, removeParticipant, transferGroupOwnership } from '../../../redux/thunks/group';
import { Ionicons } from '@expo/vector-icons';
import HeaderNavigation from '../../../components/header/HeaderNavigation';
import DefaultAvatar from '../../../components/chat/DefaultAvatar';
import { useRouter } from 'expo-router';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ManageMember = () => {
    const route = useRoute();
    const router = useRouter();
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { groupId } = route.params || {};
    const { groupDetails } = useSelector((state) => state.group);
    const [activeTab, setActiveTab] = useState("all");
    const [groupMembers, setGroupMembers] = useState([]);
    const [currentData, setCurrentData] = useState(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const { profile } = useSelector((state) => state.profile);

    const [sheetPosition, setSheetPosition] = useState(0);
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    // Lấy thông tin nhóm từ store
    useEffect(() => {
        if (groupId && groupDetails[groupId]) {
            setCurrentData(groupDetails[groupId]);
            setGroupMembers(groupDetails[groupId].participants || []);
        } else if (groupId) {
            dispatch(getGroupDetail(groupId));
        }
    }, [groupId, groupDetails]);

    // Cập nhật dữ liệu khi groupDetails thay đổi
    useEffect(() => {
        if (groupId && groupDetails[groupId]) {
            setGroupMembers(groupDetails[groupId].participants || []);
            setCurrentData(groupDetails[groupId]);
        }
    }, [groupId, groupDetails]);


    const openMemberModal = (member) => {
        setSelectedMember(member);
        setSheetOpen(true);

        // Animation hiệu ứng
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
            }),
            Animated.timing(backdropOpacity, {
                toValue: 0.5,
                duration: 300,
                useNativeDriver: true
            })
        ]).start();
    };

    const closeMemberModal = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: true
            }),
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true
            })
        ]).start(() => {
            setSheetOpen(false);
            setSelectedMember(null);
        });
    };

    // Lọc thành viên theo tab đang active
    const getFilteredMembers = () => {
        switch (activeTab) {
            case "all":
                return groupMembers;
            case "admin":
                return groupMembers.filter(member =>
                    member.userId === currentData?.ownerId ||
                    member.role === "ADMIN" ||
                    member.role === "OWNER");
            case "invited":
                // Giả định: thành viên được mời có trạng thái PENDING
                return groupMembers.filter(member => member.status === "PENDING");
            case "blocked":
                // Giả định: thành viên bị chặn có trạng thái BLOCKED
                return groupMembers.filter(member => member.status === "BLOCKED");
            default:
                return groupMembers;
        }
    };

    console.log("groupMembers ", groupMembers);

    const isCurrentUserAdmin = () => {
        // Tìm profile id của người dùng hiện tại trong danh sách thành viên
        const currentUserMember = groupMembers.find(member => member.profileId === profile?.id);
        return currentUserMember?.role === "OWNER";
    };

    // Kiểm tra xem người dùng có phải là chủ nhóm không
    const isUserAdmin = (member) => {
        return member?.role === "OWNER";
    };


    const handleAddMember = () => {
        const uniqueKey = `addParticipant-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        navigation.navigate('group/addParticipant', {
            dataDetail: currentData,
            groupName: currentData.name,
            groupId: currentData.id,
            goBackTo: 'group/manageMember',
            uniqueKey: uniqueKey
        });
    };

    const handleTransferOwnership = (member) => {
        Alert.alert(
            "Xác nhận chuyển quyền",
            `Bạn có chắc muốn chuyển quyền trưởng nhóm cho ${member?.name || "người dùng này"}?`,
            [
                {
                    text: "Hủy",
                    style: "cancel"
                },
                {
                    text: "Chuyển quyền",
                    style: "default",
                    onPress: () => {
                        // Hiển thị loading
                        closeMemberModal();

                        // Gọi thunk để chuyển quyền
                        const payload = {
                            groupId,
                            newOwnerId: member?.profileId
                        };


                        // Giả định đã có thunk transferGroupOwnership
                        dispatch(transferGroupOwnership(payload))
                            .unwrap()
                            .then((response) => {
                                console.log("Kết quả chuyển quyền:", response);

                                // Thông báo thành công
                                ToastAndroid.show("Chuyển quyền trưởng nhóm thành công", ToastAndroid.SHORT);

                                // Reload lại thông tin nhóm để cập nhật UI
                                dispatch(getGroupDetail(groupId));
                            })
                            .catch((error) => {
                                console.error("Lỗi khi chuyển quyền:", error);

                                // Hiển thị thông báo lỗi
                                Alert.alert(
                                    "Lỗi",
                                    error?.message || "Không thể chuyển quyền trưởng nhóm"
                                );
                            });
                    }
                }
            ]
        );
    };


    const handleRemoveMember = (member) => {

        console.log("member", member);

        Alert.alert(
            "Xác nhận",
            `Bạn có chắc muốn xóa ${member?.name || "thành viên này"} ra khỏi nhóm không?`,
            [
                {
                    text: "Hủy",
                    style: "cancel"
                },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: () => {
                        // Log ra để kiểm tra
                        console.log("ID nhóm:", groupId);
                        console.log("ID thành viên:", member?.profileId);

                        // Gọi thunk để xóa thành viên
                        const payload = {
                            groupId,
                            participantIds: [member?.profileId]
                        };

                        console.log("payload trước khi gửi:", payload);

                        dispatch(removeParticipant(payload))
                            .unwrap()
                            .then((response) => {
                                console.log("Kết quả xóa thành viên:", response);

                                // Thông báo thành công
                                ToastAndroid.show("Xoá thành viên thành công", ToastAndroid.SHORT);
                                setSheetOpen(false);
                                setSelectedMember(null);

                                dispatch(getGroupDetail(groupId))
                            })
                            .catch((error) => {
                                console.error("Lỗi chi tiết:", error);

                                // Xử lý lỗi
                                Alert.alert(
                                    "Lỗi",
                                    error?.message || "Không thể xóa thành viên khỏi nhóm"
                                );
                            });
                    }
                }
            ]
        );
    };


    // Danh sách chức năng cho mỗi thành viên
    const getMemberActions = () => {
        const baseActions = [
            {
                id: 'viewProfile',
                title: 'Xem trang cá nhân',
                icon: 'person-circle-outline',
                action: () => {
                    // Chức năng xem trang cá nhân
                    setSheetOpen(false);
                    // Navigation logic để xem trang cá nhân
                    router.push({
                        pathname: 'profile/[id]',
                        params: {
                            id: selectedMember?.profileId,
                            goBack: '/group/manageMember',
                        },
                    });
                }
            }
        ];

        // Chỉ thêm nút "Xóa khỏi nhóm" nếu người dùng hiện tại là admin
        // và thành viên được chọn không phải là admin
        if (isCurrentUserAdmin()) {
            // Nếu thành viên được chọn không phải là trưởng nhóm
            if (selectedMember && !isUserAdmin(selectedMember)) {
                // Thêm chức năng chuyển quyền trưởng nhóm
                baseActions.push({
                    id: 'transferOwnership',
                    title: 'Chuyển quyền trưởng nhóm',
                    icon: 'shield-checkmark-outline',
                    color: '#007AFF',
                    action: () => handleTransferOwnership(selectedMember)
                });

                // Thêm nút xóa khỏi nhóm
                baseActions.push({
                    id: 'removeMember',
                    title: 'Xóa khỏi nhóm',
                    icon: 'trash-outline',
                    color: '#FF3B30',
                    action: () => handleRemoveMember(selectedMember)
                });
            }
        }

        return baseActions;
    };

    // Xử lý khi ấn vào một thành viên
    const handleMemberPress = (member) => {
        openMemberModal(member);
    };

    console.log("selectedMember ", selectedMember?.id);

    const renderMemberItem = ({ item }) => {
        const isAdmin = isUserAdmin(item);
        const isCurrentUser = item.profileId === profile?.id;

        return (
            <TouchableOpacity
                onPress={() => handleMemberPress(item)}
                disabled={isCurrentUser} // Vô hiệu hóa cho bản thân
            >
                <YStack>
                    <XStack py="$3" px="$4" alignItems="center" justifyContent="space-between">
                        <XStack alignItems="center" flex={1}>
                            {item.avatar ? (
                                <Image
                                    source={{ uri: item.avatar }}
                                    style={styles.avatar}
                                    resizeMode="cover"
                                />
                            ) : (
                                <DefaultAvatar
                                    name={item.name || "User"}
                                    size={styles.avatar.width || 40}
                                />
                            )}
                            <YStack ml="$3" flex={1}>
                                <XStack alignItems="center">
                                    <Text fontSize="$5" fontWeight="500" numberOfLines={1} flex={1}>
                                        {item.name || "Người dùng"}
                                    </Text>
                                    {isAdmin && (
                                        <XStack
                                            backgroundColor="#fcd6bd"
                                            px="$2"
                                            py="$1"
                                            borderRadius={10}
                                            marginLeft="$2"
                                            alignItems="center"
                                        >
                                            <Ionicons name="shield" size={12} color="#FF7A1E" />
                                            <Text fontSize="$2" color="#FF7A1E" fontWeight="600" marginLeft={2}>
                                                Trưởng nhóm
                                            </Text>
                                        </XStack>
                                    )}
                                </XStack>
                                <Text fontSize="$3" color="gray">
                                    {isCurrentUser ? "Bạn" : ""}
                                </Text>
                            </YStack>
                        </XStack>

                        {!isAdmin && !isCurrentUser && (
                            <Ionicons name="ellipsis-vertical" size={20} color="#888" />
                        )}
                    </XStack>
                    <Separator ml="$4" />
                </YStack>
            </TouchableOpacity>
        );
    };

    // Sheet hiển thị thông tin thành viên
    const renderMemberModal = () => {
        if (!selectedMember && !sheetOpen) return null;

        const actions = getMemberActions();

        return (
            <>
                {/* Backdrop với opacity animation */}
                <Animated.View
                    style={[
                        styles.backdrop,
                        { opacity: backdropOpacity }
                    ]}
                    pointerEvents={sheetOpen ? "auto" : "none"}
                    onTouchEnd={closeMemberModal}
                />

                {/* Content modal với slide animation */}
                <Animated.View
                    style={[
                        styles.modalContainer,
                        { transform: [{ translateY: slideAnim }] }
                    ]}
                >
                    <View style={styles.modalHandle} />

                    <View style={styles.modalContent}>
                        <XStack justifyContent="space-between" alignItems="center" paddingBottom="$3">
                            <Text fontSize={18} fontWeight="600">Thông tin thành viên</Text>
                            <TouchableOpacity onPress={closeMemberModal}>
                                <Ionicons name="close" size={24} color="#888" />
                            </TouchableOpacity>
                        </XStack>

                        {/* Thông tin thành viên */}
                        <XStack alignItems="center" marginBottom="$5">
                            {selectedMember?.avatar ? (
                                <Image
                                    source={{ uri: selectedMember?.avatar }}
                                    style={styles.modalAvatar}
                                    resizeMode="cover"
                                />
                            ) : (
                                <DefaultAvatar
                                    name={selectedMember?.name || "User"}
                                    size={70}
                                />
                            )}
                            <YStack marginLeft="$3">
                                <Text fontSize={22} fontWeight="600">{selectedMember?.name || "Người dùng"}</Text>
                                {isUserAdmin(selectedMember) && (
                                    <XStack
                                        backgroundColor="#fcd6bd"
                                        px="$2"
                                        py="$1"
                                        borderRadius={10}
                                        marginTop="$1"
                                        alignItems="center"
                                        alignSelf="flex-start"
                                    >
                                        <Ionicons name="shield" size={12} color="#FF7A1E" />
                                        <Text fontSize="$2" color="#FF7A1E" fontWeight="600" marginLeft={2}>
                                            Trưởng nhóm
                                        </Text>
                                    </XStack>
                                )}
                            </YStack>
                        </XStack>

                        <Separator marginBottom="$3" />

                        {/* Danh sách các chức năng */}
                        <YStack space="$3">
                            {actions?.map((action) => (
                                <TouchableOpacity
                                    key={action.id}
                                    onPress={action.action}
                                    style={styles.actionButton}
                                    activeOpacity={0.7}
                                >
                                    <XStack alignItems="center">
                                        <Ionicons
                                            name={action.icon}
                                            size={24}
                                            color={action.color || "#333"}
                                        />
                                        <Text
                                            fontSize={16}
                                            fontWeight="500"
                                            color={action.color || "#333"}
                                            marginLeft="$3"
                                        >
                                            {action.title}
                                        </Text>
                                    </XStack>
                                </TouchableOpacity>
                            ))}
                        </YStack>
                    </View>
                </Animated.View>
            </>
        );
    };

    // console.log("renderMemberItem ", groupMembers);

    return (
        <YStack flex={1} backgroundColor="white">
            <HeaderNavigation title="Quản lý thành viên" />

            <Tabs
                defaultValue={activeTab}
                orientation="horizontal"
                flexDirection="column"
                borderBottomWidth={1}
                borderBottomColor="#f0f0f0"
                overflow="hidden"
                flex={1}
            >
                <Tabs.List
                    backgroundColor="white"
                >
                    <Tabs.Tab
                        height={70}
                        value="all"
                        onPress={() => setActiveTab("all")}
                        flex={1}
                        backgroundColor={activeTab === "all" ? "white" : "#f5f5f5"}
                        borderBottomWidth={activeTab === "all" ? 2 : 0}
                        borderBottomColor="#FF7A1E"
                    >
                        <Text
                            color={activeTab === "all" ? "#000" : "#888"}
                            fontWeight={activeTab === "all" ? "600" : "400"}
                        >
                            Tất cả
                        </Text>
                    </Tabs.Tab>


                </Tabs.List>

                <YStack flex={1}>


                    <YStack marginTop="$2">
                        <Text color="gray" paddingHorizontal="$4" paddingBottom="$2">
                            Thành viên ({getFilteredMembers().length})
                        </Text>



                        <FlatList
                            data={getFilteredMembers()}
                            renderItem={renderMemberItem}
                            keyExtractor={(item) => item.id || item.userId}
                            ListEmptyComponent={
                                <Text textAlign="center" margin="$4" color="gray">
                                    Không có thành viên nào
                                </Text>
                            }
                        />
                    </YStack>
                </YStack>
            </Tabs>

            {renderMemberModal()}

            {/* Nút thêm thành viên */}
            <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddMember}
            >
                <XStack
                    backgroundColor="#FF7A1E"
                    width={40}
                    height={40}
                    borderRadius={20}
                    alignItems="center"
                    justifyContent="center"
                >
                    <Ionicons name="person-add" size={20} color="white" />
                </XStack>
            </TouchableOpacity>
        </YStack>
    );
};

export default ManageMember;

const styles = StyleSheet.create({
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 40,
        backgroundColor: '#f0f0f0'
    },
    addButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 10
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'black',
        zIndex: 10
    },
    modalContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 10,
        maxHeight: '60%',
        zIndex: 11,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 8
    },
    modalContent: {
        padding: 20,
        paddingBottom: 30
    },
    modalHandle: {
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#DDD',
        alignSelf: 'center',
        marginBottom: 10
    },
    modalAvatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#f0f0f0'
    },
    actionButton: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    }
});