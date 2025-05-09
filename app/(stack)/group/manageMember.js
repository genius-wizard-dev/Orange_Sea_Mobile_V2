import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { View, Text, XStack, YStack, Separator, Tabs, Button, Sheet } from 'tamagui';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { getGroupDetail } from '../../../redux/thunks/group';
import { Ionicons } from '@expo/vector-icons';
import HeaderNavigation from '../../../components/header/HeaderNavigation';

const ManageMember = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { groupId } = route.params || {};
    const { groupDetails } = useSelector((state) => state.group);
    const [activeTab, setActiveTab] = useState("all");
    const [groupMembers, setGroupMembers] = useState([]);
    const [currentData, setCurrentData] = useState(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);

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

    // Kiểm tra xem người dùng có phải là chủ nhóm không
    const isUserAdmin = (userId) => {
        return userId === currentData?.ownerId;
    };

    // Kiểm tra xem người dùng có phải là bạn (người đã thêm) không
    const isAddedByMe = (member) => {
        // Giả định: thành viên có addedBy là người thêm họ
        return member.addedByUser?.id === currentData?.ownerId;
    };

    const handleAddMember = () => {
        navigation.navigate('group/addParticipant', {
            dataDetail: currentData,
            goBackTo: 'group/manageMember'
        });
    };

    // Danh sách chức năng cho mỗi thành viên
    const memberActions = [
        {
            id: 'viewProfile',
            title: 'Xem trang cá nhân',
            icon: 'person-circle-outline',
            action: () => {
                // Chức năng xem trang cá nhân
                setSheetOpen(false);
                // Navigation logic để xem trang cá nhân
            }
        },
        // {
        //     id: 'blockMember',
        //     title: 'Chặn thành viên',
        //     icon: 'ban-outline',
        //     action: () => {
        //         // Chức năng chặn thành viên
        //         setModalVisible(false);
        //         // Logic để chặn thành viên
        //     }
        // },
        {
            id: 'removeMember',
            title: 'Xóa khỏi nhóm',
            icon: 'trash-outline',
            color: '#FF3B30',
            action: () => {
                // Chức năng xóa khỏi nhóm
                setSheetOpen(false);
                // Logic để xóa thành viên khỏi nhóm
            }
        }
    ];

    // Xử lý khi ấn vào một thành viên
    const handleMemberPress = (member) => {
        setSelectedMember(member);
        setSheetOpen(true);
    };

    const renderMemberItem = ({ item }) => {
        const isAdmin = isUserAdmin(item.userId);
        const isFriend = isAddedByMe(item);

        return (
            <TouchableOpacity 
                onPress={() => handleMemberPress(item)}
                disabled={isAdmin} // Vô hiệu hóa cho trưởng nhóm
            >
                <YStack>
                    <XStack py="$3" px="$4" alignItems="center" justifyContent="space-between">
                        <XStack alignItems="center" flex={1}>
                            <Image
                                source={{ uri: item.user?.avatar || "https://i.ibb.co/jvVzkvBm/bgr-default.png" }}
                                style={styles.avatar}
                            />
                            <YStack ml="$3" flex={1}>
                                <XStack alignItems="center">
                                    <Text fontSize="$5" fontWeight="500" numberOfLines={1} flex={1}>
                                        {item.user?.name || "Người dùng"}
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
                                    {isFriend ? "Thêm bởi bạn" : ""}
                                </Text>
                            </YStack>
                        </XStack>
                        
                        {!isAdmin && (
                            <Ionicons name="ellipsis-vertical" size={20} color="#888" />
                        )}
                    </XStack>
                    <Separator ml="$4" />
                </YStack>
            </TouchableOpacity>
        );
    };

    // Sheet hiển thị thông tin thành viên
    const renderMemberSheet = () => {
        if (!selectedMember) return null;
        
        return (
            <Sheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                snapPoints={[50]}
                snapPointsMode="percent"
                dismissOnSnapToBottom
                position={0}
                zIndex={100_003}
            >
                <Sheet.Overlay />
                <Sheet.Frame backgroundColor="white" padding="$4">
                    <XStack justifyContent="space-between" alignItems="center" paddingBottom="$4">
                        <Text fontSize={18} fontWeight="600">Thông tin thành viên</Text>
                        <TouchableOpacity onPress={() => setSheetOpen(false)}>
                            <Ionicons name="close" size={24} color="#888" />
                        </TouchableOpacity>
                    </XStack>
                    
                    {/* Thông tin thành viên */}
                    <XStack alignItems="center" marginBottom="$5">
                        <Image
                            source={{ uri: selectedMember.user?.avatar || "https://i.ibb.co/jvVzkvBm/bgr-default.png" }}
                            style={styles.modalAvatar}
                        />
                        <YStack marginLeft="$3">
                            <Text fontSize={22} fontWeight="600">{selectedMember.user?.name || "Người dùng"}</Text>
                        </YStack>
                    </XStack>
                    
                    <Separator marginBottom="$2" />
                    
                    {/* Danh sách các chức năng */}
                    <YStack space="$3">
                        {memberActions.map((action) => (
                            <TouchableOpacity key={action.id} onPress={action.action}>
                                <YStack paddingVertical="$2">
                                    <XStack alignItems="center">
                                        <Ionicons 
                                            name={action.icon} 
                                            size={24} 
                                            color={action.color || "#000"} 
                                        />
                                        <Text 
                                            fontSize={16} 
                                            fontWeight="400" 
                                            color={action.color || "#000"} 
                                            marginLeft="$3"
                                        >
                                            {action.title}
                                        </Text>
                                    </XStack>
                                </YStack>
                                <Separator />
                            </TouchableOpacity>
                        ))}
                    </YStack>
                </Sheet.Frame>
            </Sheet>
        );
    };

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

                    {/* <Tabs.Tab
                        height={70}
                        value="admin"
                        onPress={() => setActiveTab("admin")}
                        flex={1}
                        backgroundColor={activeTab === "admin" ? "white" : "#f5f5f5"}
                        borderBottomWidth={activeTab === "admin" ? 2 : 0}
                        borderBottomColor="#FF7A1E"
                    >
                        <Text
                            color={activeTab === "admin" ? "#000" : "#888"}
                            fontWeight={activeTab === "admin" ? "600" : "400"}
                        >
                            Trưởng và phó nhóm
                        </Text>
                    </Tabs.Tab> */}


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

            {renderMemberSheet()}

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
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    modalAvatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#f0f0f0'
    }
});