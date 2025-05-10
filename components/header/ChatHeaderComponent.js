import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { memo, useMemo, useEffect } from 'react';
import { useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import { useSelector } from 'react-redux';

const ChatHeaderComponent = memo(({ dataDetail, goBack, title, refreshKey, groupId }) => {
    const router = useRouter();
    const navigation = useNavigation();
    const { groupDetails } = useSelector((state) => state.group); // Lấy trực tiếp từ Redux

    const handleBackPress = () => {
        // Đơn giản hóa logic back: nếu có goBack thì sử dụng, nếu không thì router.back()
        if (goBack) {
            router.push(goBack);
        } else {
            router.back();
        }
    };

    const handleOpenGroupDetail = () => {
        // Lấy dữ liệu mới nhất từ Redux store thay vì sử dụng dataDetail được truyền vào
        const groupId = dataDetail?.id;
        const latestGroupDetail = groupId ? groupDetails[groupId] : dataDetail;

        navigation.navigate('group/groupDetail', {

            dataDetail: latestGroupDetail || dataDetail, // Sử dụng dữ liệu mới nhất hoặc fallback về dataDetail
            fromScreen: 'chat/chatDetail',
            directFromChat: true,
            groupId: groupId,
            timestamp: Date.now() // Thêm timestamp để đảm bảo params là duy nhất
        });
    };

    // Force re-render khi refreshKey thay đổi
    useEffect(() => {
        console.log("ChatHeader re-rendering with refreshKey:", refreshKey);
    }, [refreshKey]);

    // Tính toán tên để hiển thị, ưu tiên lấy từ Redux store nếu có
    const displayTitle = useMemo(() => {
        // Nếu có title được truyền vào thì sử dụng
        if (title) return title;

        // Không thì lấy từ dataDetail
        if (dataDetail) {
            if (dataDetail.isGroup) {
                return dataDetail.name || 'Nhóm chat';
            } else if (dataDetail.participants && dataDetail.participants.length > 0) {
                // Lấy người dùng đầu tiên
                return dataDetail.participants[0]?.user?.name || 'Chat';
            }
        }
        return '';
    }, [title, dataDetail, refreshKey]);

    return (
        <View style={styles.header}>
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                <Ionicons name="arrow-back" size={25} color="#fff" marginRight={7} marginLeft={7} />
                <View>
                    <Text style={styles.title}>{displayTitle}</Text>
                    {dataDetail?.isGroup ? <Text style={styles.totalMember}> {dataDetail?.participants?.length} thành viên </Text> : ""}
                </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleOpenGroupDetail} style={styles.btnDetail}>
                <Ionicons name="list-outline" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
});

export default ChatHeaderComponent;

const styles = StyleSheet.create({
    header: {
        height: 50,
        backgroundColor: '#FF7A1E',
        padding: 10,
        paddingBottom: 4,
        paddingTop: 4,
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        color: '#fff',
        fontSize: 20,
        marginLeft: 10,
        fontWeight: '500'
    },
    totalMember: {
        color: '#ededed',
        fontSize: 11,
        marginLeft: 8,
        fontWeight: '400'
    },
    btnDetail: {
        marginRight: 5,
    }
});