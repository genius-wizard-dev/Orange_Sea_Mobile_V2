import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome, Feather, AntDesign } from '@expo/vector-icons';
import { Image, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, ToastAndroid } from 'react-native';
import { View, Text, XStack, YStack, ScrollView, Separator, Switch, Button, Input, Adapt, Sheet } from 'tamagui';
import HeaderLeft from '../../../components/header/HeaderLeft';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteGroup, getGroupDetail, leaveGroup, renameGroup } from '../../../redux/thunks/group';
import HeaderNavigation from '../../../components/header/HeaderNavigation';
import EditNamePopover from '../../../components/group/EditNamePopover';
import { set } from 'zod';

const GroupDetail = () => {
    const { goBackTo } = useLocalSearchParams();
    const route = useRoute();
    const navigation = useNavigation();
    const router = useRouter(); // Thêm useRouter
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);

    // Lấy dataDetail từ params hoặc từ Redux store

    const groupId = route.params?.groupId;
    // const { dataDetail: routeDataDetail } = route.params || {};
    const { groupDetails } = useSelector((state) => state.group);
    const { profile } = useSelector((state) => state.profile);

    // console.log("groupId ", groupId)
    // console.log("groupDetails", JSON.stringify(groupDetails[groupId], null, 2));
    // console.log("profile ", profile)


    // Kết hợp dữ liệu từ route.params và Redux store
    const [currentData, setCurrentData] = useState(null);
    const [isOwner, setIsOwner] = useState(false);


    useEffect(() => {
        // Ưu tiên dữ liệu từ route.params (mới nhất)
        if (groupId && groupDetails[groupId]) {
            const groupDetail = groupDetails[groupId];
            setCurrentData(groupDetail);

            // Kiểm tra vai trò của người dùng hiện tại
            if (groupDetail.participants) {
                const currentUserParticipant = groupDetail.participants.find(
                    p => p.profileId === profile?.id
                );
                setIsOwner(currentUserParticipant?.role === "OWNER");
            }
            // if ((!groupDetails[groupId] ||
            //     (groupDetails[groupId]?.updatedAt !== groupDetails.updatedAt))) {
            //     dispatch(getGroupDetail(groupDetails.id));
            // }
        }

        else if (groupId) {
            dispatch(getGroupDetail(groupId))
                .then((action) => {
                    if (action.payload && !action.error) {
                        const data = action.payload.data || action.payload;
                        setCurrentData(data);

                        // Kiểm tra vai trò của người dùng hiện tại
                        if (data.participants) {
                            const currentUserParticipant = data.participants.find(
                                p => p.profileId === profile?.id
                            );
                            setIsOwner(currentUserParticipant?.role === "OWNER");
                        }
                    }
                });
        }
    }, [groupId, groupDetails, profile, dispatch]);

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
                        ToastAndroid.show("Đổi tên nhóm thành công", ToastAndroid.SHORT);
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


    // Handle group deletion
    const handleDeleteGroup = () => {
        if (!isOwner || !currentData?.isGroup) return;

        Alert.alert(
            'Xác nhận giải tán nhóm',
            'Tất cả mọi người sẽ rời nhóm và xoá tin nhắn, nhóm giải tán sẽ không được khôi phục',
            [
                {
                    text: 'Huỷ',
                    style: 'cancel',
                },
                {
                    text: 'Giải tán',
                    style: 'destructive',
                    onPress: async () => {
                        try {

                            if (!currentData || !currentData.id) {
                                console.error('Không tìm thấy ID nhóm');
                                Alert.alert('Lỗi', 'Không thể giải tán nhóm. Vui lòng thử lại sau.');
                                return;
                            }

                            console.log("ID nhóm cần xóa:", currentData.id);

                            const result = await dispatch(deleteGroup(currentData.id)).unwrap();
                            console.log('Kết quả xóa nhóm:', result);

                            // Đợi 500ms để đảm bảo redux store đã được cập nhật
                            setTimeout(() => {
                                // Thông báo thành công
                                Alert.alert('Thành công', 'Nhóm đã được giải tán', [
                                    {
                                        text: 'OK',
                                        onPress: () => {
                                            navigation.reset({
                                                index: 0,
                                                routes: [{
                                                    name: '(tabs)',
                                                    params: { screen: 'chat' }
                                                }],
                                            });
                                        }
                                    }
                                ]);
                            }, 500);

                        } catch (error) {
                            console.error('Lỗi khi giải tán nhóm:', error);
                            Alert.alert('Lỗi', 'Không thể giải tán nhóm. Vui lòng thử lại sau.');

                        }
                    }
                }
            ],
            { cancelable: true }
        );
    };

    const handleLeaveGroup = () => {
        // Hiển thị loading
        setIsLoading(true);

        // Gọi thunk đúng cách với unwrap() để bắt lỗi
        dispatch(leaveGroup(groupId))
            .unwrap() // Quan trọng: dùng unwrap() để có thể sử dụng then/catch
            .then((response) => {
                console.log("Kết quả rời nhóm thành công:", response);

                // Hiển thị thông báo thành công
                ToastAndroid.show("Đã rời khỏi nhóm", ToastAndroid.SHORT);

                // Điều hướng về tab chat
                setTimeout(() => {
                    router.replace('/(tab)/chat');
                }, 300);
            })
            .catch((error) => {
                console.log("Error object:", error);

                // Lấy thông tin lỗi từ response
                const errorMessage = error?.response?.error ||
                    "Bạn là trưởng nhóm, cần phải chuyển quyền cho người khác trước khi rời nhóm.";

                // Hiển thị Alert với thông báo lỗi từ API
                Alert.alert(
                    "Không thể rời khỏi nhóm",
                    errorMessage,
                    [{
                        text: "Quản lý thành viên",
                        onPress: () => {
                            // Điều hướng đến trang quản lý thành viên
                            navigation.navigate("group/manageMember", {
                                groupId: currentData.id,
                                groupName: currentData.name,
                                fromScreen: 'group/groupDetail',
                                goBackTo: goBackTo || 'group/groupDetail'
                            });
                        }
                    }]
                );
            })
            .finally(() => {
                // Tắt loading
                setIsLoading(false);
            });
    };


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
                    id: 'profile',
                    icon: 'person-outline',
                    label: 'Trang cá nhân',
                    typeGroup: "ACCOUNT",
                    onPress: () => {
                        // Tìm người dùng khác trong cuộc trò chuyện 1-1
                        const otherUser = currentData?.participants?.find(p =>
                            p.profileId !== profile?.id
                        );

                        if (otherUser) {
                            router.push({
                                pathname: 'profile/[id]',
                                params: {
                                    id: otherUser.profileId || otherUser.id,
                                    goBack: '/group/groupDetail',
                                },
                            });
                        } else {
                            Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
                        }
                    }
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
                    onPress: () => navigation.navigate("group/manageMedia", {
                        groupId: currentData.id,
                        groupName: getDisplayName()
                    })
                },
                // {
                //     id: 'pinned',
                //     icon: 'pricetag',
                //     iconFamily: 'Ionicons',
                //     label: 'Tin nhắn đã ghim',
                //     typeGroup: "ALL",
                //     onPress: () => console.log('Tin nhắn đã ghim')
                // },
                // {
                //     id: 'calendar',
                //     icon: 'calendar',
                //     iconFamily: 'Ionicons',
                //     label: 'Lịch nhóm',
                //     typeGroup: "GROUP",
                //     onPress: () => console.log('Lịch nhóm')
                // },
            ]
        },
        {
            id: 'member',
            type: 'member',
            items: [
                // {
                //     id: 'settingGroup',
                //     icon: 'cog',
                //     iconFamily: 'Ionicons',
                //     label: "Cài đặt nhóm",
                //     typeGroup: "GROUP",
                //     onPress: () => console.log('chuyen uyen truong nhom')
                // },
                {
                    id: 'media',
                    icon: 'people-circle',
                    iconFamily: 'Ionicons',
                    label: "Xem thành viên (" + currentData?.participants?.length + ")",
                    typeGroup: "GROUP",
                    onPress: () =>
                        navigation.navigate("group/manageMember", {
                            groupId: currentData.id,
                            groupName: currentData.name,
                            fromScreen: 'group/groupDetail',
                            goBackTo: goBackTo || 'group/groupDetail'
                        })
                },
            ]
        },
        // {
        //     id: 'settings',
        //     type: 'switch',
        //     items: [
        //         {
        //             id: 'pin',
        //             icon: 'pushpin',
        //             iconFamily: 'AntDesign',
        //             label: 'Ghim trò chuyện',
        //             typeGroup: "ALL",
        //             value: isGhimEnabled,
        //             onChange: setIsGhimEnabled
        //         },
        //         {
        //             id: 'hide',
        //             icon: 'eye-off',
        //             iconFamily: 'Feather',
        //             label: 'Ẩn trò chuyện',
        //             typeGroup: "ALL",
        //             value: isAnEnabled,
        //             onChange: setIsAnEnabled
        //         },
        //     ]
        // },
        {
            id: 'actions',
            type: 'menu',
            items: [
                // {
                //     id: 'transferOwner',
                //     icon: 'shield-checkmark-outline',
                //     iconFamily: 'Ionicons',
                //     label: 'Chuyển quyền trưởng nhóm',
                //     typeGroup: "ALL",
                //     onPress: () => console.log('Báo xấu'),
                //     textColor: 'black'
                // },
                {
                    id: 'leaveGroup',
                    icon: 'logout',
                    iconFamily: 'MaterialIcons',
                    label: 'Rời nhóm',
                    typeGroup: "GROUP",
                    onPress: () => {
                        Alert.alert(
                            'Xác nhận',
                            'Bạn có chắc muốn rời nhóm?',
                            [
                                {
                                    text: 'Hủy',
                                    style: 'cancel'
                                },
                                {
                                    text: 'Rời nhóm',
                                    style: 'destructive',
                                    onPress: () => handleLeaveGroup()
                                }
                            ]
                        );
                    },
                    textColor: '#FF3B30'
                },
                ...(isOwner && currentData?.isGroup ? [{
                    id: 'deleteGroup',
                    icon: 'delete',
                    iconFamily: 'MaterialIcons',
                    label: 'Giải tán nhóm',
                    typeGroup: "GROUP",
                    onPress: handleDeleteGroup,
                    textColor: '#FF3B30'
                }] : [])
            ]
        }
    ];

    const getAvatar = () => {
        if (currentData?.isGroup) {
            return currentData.avatar || "https://res.cloudinary.com/dubwmognz/image/upload/v1747834144/chat-images/photo-1747834136025_6edcab02.jpg?dl=photo-1747834136025.jpg";
        } else {
            // Kiểm tra xem participants có tồn tại không trước khi dùng find
            if (!currentData?.participants || !Array.isArray(currentData?.participants)) {
                return "https://res.cloudinary.com/dubwmognz/image/upload/v1747834144/chat-images/photo-1747834136025_6edcab02.jpg?dl=photo-1747834136025.jpg";
            }
            const otherUser = currentData?.participants?.find(p => p?.role === "MEMBER");
            return otherUser?.avatar || "https://res.cloudinary.com/dubwmognz/image/upload/v1747834144/chat-images/photo-1747834136025_6edcab02.jpg?dl=photo-1747834136025.jpg";
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

            // Tìm người dùng khác mình trong cuộc trò chuyện 1-1
            const otherUser = currentData.participants.find(p =>
                p.profileId !== profile.id
            );
            // console.log("profile ", profile)
            // console.log("otherUser", otherUser)

            // Nếu tìm thấy người dùng khác, hiển thị tên của họ
            if (otherUser) {
                return otherUser.name || otherUser.name || "Cá nhân";
            }

            return "Cá nhân";
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
            {
                groupDetails[groupId].isGroup && isOwner &&
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
            }


            <View flexDirection='row' alignItems='center' flex={1}>
                <Text color="black" fontSize="$7" fontWeight="bold" textAlign="center" marginTop="$4" marginRight={20}>
                    {getDisplayName()}
                </Text>
                {
                    currentData.isGroup && isOwner && (

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
            {isLoading && (
                <View style={[styles.overlay, { zIndex: 9999 }]}>
                    <ActivityIndicator size="large" color="#FF7A1E" />
                    <Text style={{ marginTop: 10, color: 'white' }}>Đang xử lý...</Text>
                </View>
            )}
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

const styles = StyleSheet.create({
    // Styles hiện có

    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    }
});