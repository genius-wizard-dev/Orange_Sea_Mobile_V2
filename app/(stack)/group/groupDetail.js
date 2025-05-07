import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome, Feather, AntDesign } from '@expo/vector-icons';
import { Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { View, Text, XStack, YStack, ScrollView, Separator, Switch, Button, Input, Adapt, Sheet } from 'tamagui';
import HeaderLeft from '../../../components/header/HeaderLeft';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getGroupDetail, renameGroup } from '../../../redux/thunks/group';
import HeaderNavigation from '../../../components/header/HeaderNavigation';
import EditNamePopover from '../../../components/group/EditNamePopover';

const GroupDetail = () => {
    const { goBackTo } = useLocalSearchParams();
    const route = useRoute();
    const navigation = useNavigation();
    const router = useRouter(); // Thêm useRouter
    const dispatch = useDispatch();

    // Lấy dataDetail từ params hoặc từ Redux store
    const { dataDetail: routeDataDetail } = route.params || {};
    const { groupDetails } = useSelector((state) => state.group);

    // Kết hợp dữ liệu từ route.params và Redux store
    const [currentData, setCurrentData] = useState(null);


    useEffect(() => {
        // Lấy groupId từ route.params nếu không có dataDetail
        const groupIdFromParams = route.params?.groupId;
        
        // Ưu tiên dữ liệu từ route.params (mới nhất)
        if (routeDataDetail) {
            setCurrentData(routeDataDetail);

            // Cập nhật lại Redux store nếu cần
            if (routeDataDetail.id && (!groupDetails[routeDataDetail.id] ||
                (groupDetails[routeDataDetail.id]?.updatedAt !== routeDataDetail.updatedAt))) {
                dispatch(getGroupDetail(routeDataDetail.id));
            }
        }
        // Nếu không có dữ liệu từ route.params, kiểm tra từ Redux store bằng groupId
        else if (groupIdFromParams && groupDetails[groupIdFromParams]) {
            setCurrentData(groupDetails[groupIdFromParams]);
        }
        // Nếu không có dữ liệu từ cả hai nguồn, nhưng có groupId, gọi API để lấy
        else if (groupIdFromParams) {
            dispatch(getGroupDetail(groupIdFromParams))
                .then((action) => {
                    if (action.payload && !action.error) {
                        const data = action.payload.data || action.payload;
                        setCurrentData(data);
                    }
                });
        }
    }, [route.params, groupDetails, dispatch]);

    const [isGhimEnabled, setIsGhimEnabled] = useState(false);
    const [isAnEnabled, setIsAnEnabled] = useState(false);
    const [isEditNameOpen, setIsEditNameOpen] = useState(false);
    const [newName, setNewName] = useState('');

    const handleOpenEditName = () => {
        setIsEditNameOpen(true);
        setNewName(getDisplayName());
    };

    const handleSaveName = async (name) => {
        try {
            // Chỉ thực hiện đổi tên nếu tên mới khác tên cũ
            if (name !== getDisplayName() && name.trim() !== '') {
                if (currentData.isGroup) {

                    const result = await dispatch(renameGroup({
                        groupId: currentData.id,
                        newName: name
                    })).unwrap();

                    if (result && result.statusCode === 200) {
                        setCurrentData({
                            ...currentData,
                            name: name
                        });
                        alert('Đổi tên nhóm thành công!');
                        return Promise.resolve();
                    } else {
                        console.error('Lỗi đổi tên nhóm:', result);
                        return Promise.reject('Có lỗi khi đổi tên nhóm');
                    }
                } else {
                    alert('Đổi tên cá nhân không khả dụng');
                }
            } else {
                alert('Tên không được để trống hoặc giống tên cũ');
            }
        } catch (error) {
            console.error('Lỗi khi đổi tên:', error);
            return Promise.reject(error);
        }
    };

    // Kiểm tra nếu không có data và đang đợi data từ API
    if (!currentData) {
        return (
            <YStack flex={1} backgroundColor="#ffffff">
                <HeaderNavigation title="Tùy chọn" />
                <YStack flex={1} justifyContent="center" alignItems="center">
                    <ActivityIndicator size="large" color="#FF7A1E" />
                    <Text color="#888" marginTop={10}>Đang tải thông tin nhóm...</Text>
                </YStack>
            </YStack>
        );
    }

    // console.log(currentData)

    const handleAddMember = () => {
        if (currentData.isGroup) {
            const uniqueKey = `addParticipant-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            
            // Chỉ truyền ID, không truyền đối tượng phức tạp
            navigation.navigate("group/addParticipant", {
                groupId: currentData.id,
                groupName: currentData.name,
                fromScreen: 'group/groupDetail',
                goBackTo: goBackTo || 'group/groupDetail',
                uniqueKey: uniqueKey
            });
        } else {
            alert('Thêm thành viên không khả dụng cho tài khoản cá nhân');
        }
    }


    // Định nghĩa các nhóm menu
    const menuGroups = [
        {
            id: 'quickActions',
            type: 'icons',
            items: [
                {
                    id: 'search',
                    icon: 'search',
                    label: 'Tìm tin nhắn',
                    typeGroup: "ALL",
                    onPress: () => console.log('Tìm tin nhắn')
                },
                {
                    id: 'addMember',
                    icon: 'person-add',
                    label: 'Thêm thành viên',
                    typeGroup: "GROUP",
                    onPress: () => handleAddMember()
                },
            ]
        },
        {
            id: 'features',
            type: 'menu',
            items: [
                {
                    id: 'media',
                    icon: 'image',
                    iconFamily: 'Ionicons',
                    label: 'Ảnh, file, link',
                    typeGroup: "ALL",
                    onPress: () => console.log('Ảnh, file, link')
                },
                {
                    id: 'pinned',
                    icon: 'pricetag',
                    iconFamily: 'Ionicons',
                    label: 'Tin nhắn đã ghim',
                    typeGroup: "ALL",
                    onPress: () => console.log('Tin nhắn đã ghim')
                },
                {
                    id: 'calendar',
                    icon: 'calendar',
                    iconFamily: 'Ionicons',
                    label: 'Lịch nhóm',
                    typeGroup: "GROUP",
                    onPress: () => console.log('Lịch nhóm')
                },
            ]
        },
        {
            id: 'member',
            type: 'member',
            items: [
                {
                    id: 'settingGroup',
                    icon: 'cog',
                    iconFamily: 'Ionicons',
                    label: "Cài đặt nhóm",
                    typeGroup: "GROUP",
                    onPress: () => console.log('chuyen uyen truong nhom')
                },
                {
                    id: 'media',
                    icon: 'people-circle',
                    iconFamily: 'Ionicons',
                    label: "Xem thành viên (" + currentData?.participants?.length + ")",
                    typeGroup: "GROUP",
                    onPress: () => console.log('XEM THÀNH VIÊN')
                },
            ]
        },
        {
            id: 'settings',
            type: 'switch',
            items: [
                {
                    id: 'pin',
                    icon: 'pushpin',
                    iconFamily: 'AntDesign',
                    label: 'Ghim trò chuyện',
                    typeGroup: "ALL",
                    value: isGhimEnabled,
                    onChange: setIsGhimEnabled
                },
                {
                    id: 'hide',
                    icon: 'eye-off',
                    iconFamily: 'Feather',
                    label: 'Ẩn trò chuyện',
                    typeGroup: "ALL",
                    value: isAnEnabled,
                    onChange: setIsAnEnabled
                },
            ]
        },
        {
            id: 'actions',
            type: 'menu',
            items: [
                {
                    id: 'report',
                    icon: 'warning',
                    iconFamily: 'AntDesign',
                    label: 'Báo xấu',
                    typeGroup: "ALL",
                    onPress: () => console.log('Báo xấu'),
                    textColor: 'black'
                },
                {
                    id: 'leaveGroup',
                    icon: 'logout',
                    iconFamily: 'MaterialIcons',
                    label: 'Rời nhóm',
                    typeGroup: "GROUP",
                    onPress: () => Alert.alert('Xác nhận', 'Bạn có chắc muốn rời nhóm?'),
                    textColor: '#FF3B30'
                },
                {
                    id: 'deleteGroup',
                    icon: 'delete',
                    iconFamily: 'MaterialIcons',
                    label: 'Xoá cuộc trò chuyện',
                    typeGroup: "ALL",
                    onPress: () => Alert.alert('Xác nhận', 'Bạn có chắc muốn xoá cuộc trò chuyện?'),
                    textColor: '#FF3B30'
                },
            ]
        }
    ];

    const getAvatar = () => {
        if (currentData?.isGroup) {
            return currentData.avatar || "https://i.ibb.co/jvVzkvBm/bgr-default.png";
        } else {
            // Kiểm tra xem participants có tồn tại không trước khi dùng find
            if (!currentData?.participants || !Array.isArray(currentData?.participants)) {
                return "https://i.ibb.co/jvVzkvBm/bgr-default.png";
            }
            const otherUser = currentData?.participants?.find(p => p?.role === "MEMBER");
            return otherUser?.user?.avatar || "https://i.ibb.co/jvVzkvBm/bgr-default.png";
        }
    };

    const getDisplayName = () => {
        if (currentData?.isGroup) {
            return currentData.name || "Nhóm chat";
        } else {
            // Kiểm tra xem participants có tồn tại không trước khi dùng find
            if (!currentData?.participants || !Array.isArray(currentData?.participants)) {
                return "Cá nhân";
            }
            // Lấy participant khác mình
            const otherUser = currentData?.participants?.find(p => p?.role === "MEMBER");
            return otherUser?.user?.name || "Cá nhân";
        }
    };

    // Render group avatar and title
    const renderHeader = () => (
        <YStack alignItems="center" padding="$4" space="$2">
            <Image
                source={{ uri: getAvatar() }}
                style={{
                    width: 90,
                    height: 90,
                    borderRadius: 60,
                    backgroundColor: '#f0f0f0'
                }}
            />
            <TouchableOpacity>
                <Feather name="camera" size={18} color="black" style={{
                    position: 'absolute',
                    right: -50,
                    bottom: 5,
                    backgroundColor: '#e0e0e0',
                    borderRadius: 12,
                    padding: 5
                }} />
            </TouchableOpacity>

            <View flexDirection='row' alignItems='center' flex={1}>
                <Text color="black" fontSize="$7" fontWeight="bold" textAlign="center" marginTop="$4" marginRight={20}>
                    {getDisplayName()}
                </Text>
                {
                    currentData.isGroup && (

                        <EditNamePopover
                            isOpen={isEditNameOpen}
                            onClose={() => setIsEditNameOpen(false)}
                            onSave={handleSaveName}
                            initialName={getDisplayName()}
                            placeholderText={currentData?.isGroup ? "Nhập tên nhóm" : "Nhập biệt danh"}
                        >
                            <XStack
                                backgroundColor="#f0f0f0"
                                width={35}
                                height={35}
                                borderRadius={25}
                                alignItems="center"
                                justifyContent="center"
                                marginBottom="$1"
                                marginTop={10}
                                onPress={handleOpenEditName}
                            >
                                <Ionicons name="eyedrop-outline" size={20} color="#FF7A1E" />
                            </XStack>
                        </EditNamePopover>)
                }

            </View>

            {/* ...existing code... */}
        </YStack>
    );

    // Render các component dựa vào loại nhóm menu
    const renderMenuGroup = (group) => {
        switch (group.type) {
            case 'icons':
                return (
                    <YStack key={group.id} marginVertical="$2">
                        <XStack justifyContent="space-around" padding="$2">
                            {group.items
                                .filter(item => {
                                    if (item.typeGroup === "ALL") return true;
                                    if (currentData?.isGroup && item.typeGroup === "GROUP") return true;
                                    if (!currentData?.isGroup && item.typeGroup === "ACCOUNT") return true;
                                    return false;
                                })
                                .map(item => (
                                    <YStack key={item.id} alignItems="center">
                                        <TouchableOpacity onPress={item.onPress}>
                                            <XStack
                                                backgroundColor="#f0f0f0"
                                                width={40}
                                                height={40}
                                                borderRadius={25}
                                                alignItems="center"
                                                justifyContent="center"
                                                marginBottom="$1"
                                            >
                                                <Ionicons name={item.icon} size={20} color="#FF7A1E" />
                                            </XStack>
                                        </TouchableOpacity>
                                        <Text color="black" fontSize="$2" marginTop={10}>{item.label}</Text>
                                    </YStack>
                                ))
                            }
                        </XStack>
                    </YStack>
                );
            case 'menu':
                return (
                    <YStack key={group.id}>
                        {group.items
                            .filter(item => {
                                if (item.typeGroup === "ALL") return true;
                                if (currentData?.isGroup && item.typeGroup === "GROUP") return true;
                                if (!currentData?.isGroup && item.typeGroup === "ACCOUNT") return true;
                                return false;
                            })
                            .map(item => {
                                // Chọn Icon Component dựa vào iconFamily
                                const IconComponent = {
                                    Ionicons: Ionicons,
                                    MaterialIcons: MaterialIcons,
                                    MaterialCommunityIcons: MaterialCommunityIcons,
                                    FontAwesome: FontAwesome,
                                    Feather: Feather,
                                    AntDesign: AntDesign
                                }[item.iconFamily || 'Ionicons'];
                                return (
                                    <TouchableOpacity key={item.id} onPress={item.onPress}>
                                        <XStack
                                            alignItems="center"
                                            paddingVertical="$4"
                                            paddingHorizontal="$4"
                                        >
                                            <XStack
                                                backgroundColor="#fcd6bd"
                                                width={35}
                                                height={35}
                                                borderRadius={20}
                                                alignItems="center"
                                                justifyContent="center"
                                                marginRight="$3"
                                            >
                                                <IconComponent name={item.icon} size={20} color="#FF7A1E" />
                                            </XStack>
                                            <Text color={item.textColor || "black"} fontSize="$4">{item.label}</Text>
                                        </XStack>
                                    </TouchableOpacity>
                                );
                            })}
                    </YStack>
                );
            case 'member':
                return (
                    <YStack key={group.id}>
                        {group.items
                            .filter(item => {
                                if (item.typeGroup === "ALL") return true;
                                if (currentData?.isGroup && item.typeGroup === "GROUP") return true;
                                if (!currentData?.isGroup && item.typeGroup === "ACCOUNT") return true;
                                return false;
                            })
                            .map(item => {
                                // Chọn Icon Component dựa vào iconFamily
                                const IconComponent = {
                                    Ionicons: Ionicons,
                                    MaterialIcons: MaterialIcons,
                                    MaterialCommunityIcons: MaterialCommunityIcons,
                                    FontAwesome: FontAwesome,
                                    Feather: Feather,
                                    AntDesign: AntDesign
                                }[item.iconFamily || 'Ionicons'];
                                return (
                                    <TouchableOpacity key={item.id} onPress={item.onPress}>
                                        <XStack
                                            alignItems="center"
                                            paddingVertical="$4"
                                            paddingHorizontal="$4"
                                        >
                                            <XStack
                                                backgroundColor="#fcd6bd"
                                                width={35}
                                                height={35}
                                                borderRadius={20}
                                                alignItems="center"
                                                justifyContent="center"
                                                marginRight="$3"
                                            >
                                                <IconComponent name={item.icon} size={20} color="#FF7A1E" />
                                            </XStack>
                                            <Text color={item.textColor || "black"} fontSize="$4">{item.label}</Text>
                                        </XStack>
                                    </TouchableOpacity>
                                );
                            })}
                    </YStack>
                );
            case 'switch':
                return (
                    <YStack key={group.id}>
                        {group.items
                            .filter(item => {
                                if (item.typeGroup === "ALL") return true;
                                if (currentData?.isGroup && item.typeGroup === "GROUP") return true;
                                if (!currentData?.isGroup && item.typeGroup === "ACCOUNT") return true;
                                return false;
                            })
                            .map(item => {
                                const IconComponent = {
                                    Ionicons: Ionicons,
                                    MaterialIcons: MaterialIcons,
                                    MaterialCommunityIcons: MaterialCommunityIcons,
                                    FontAwesome: FontAwesome,
                                    Feather: Feather,
                                    AntDesign: AntDesign
                                }[item.iconFamily || 'Ionicons'];
                                return (
                                    <XStack
                                        key={item.id}
                                        justifyContent="space-between"
                                        alignItems="center"
                                        paddingVertical="$4"
                                        paddingHorizontal="$4"
                                    >
                                        <XStack alignItems="center">
                                            <XStack
                                                backgroundColor="#fcd6bd"
                                                width={35}
                                                height={35}
                                                borderRadius={20}
                                                alignItems="center"
                                                justifyContent="center"
                                                marginRight="$3"
                                            >
                                                <IconComponent name={item.icon} size={20} color="#FF7A1E" />
                                            </XStack>
                                            <Text color="black" fontSize="$4">{item.label}</Text>
                                        </XStack>
                                        <Switch checked={item.value} onCheckedChange={item.onChange} />
                                    </XStack>
                                );
                            })}
                    </YStack>
                );
            default:
                return null;
        }
    };

    return (
        <YStack flex={1} backgroundColor="#ffffff">
            <HeaderNavigation
                title="Tùy chọn"
            // onGoBack={handleGoBack} 
            />

            <ScrollView>
                {renderHeader()}

                {/* Render các menu group */}
                {menuGroups.map((group, index) => (
                    <YStack key={group.id}>
                        {renderMenuGroup(group)}
                        {index < menuGroups.length - 1 && (
                            <Separator backgroundColor="#f0f0f0" marginVertical="$2" />
                        )}
                    </YStack>
                ))}
            </ScrollView>
        </YStack>
    );
};

export default GroupDetail;