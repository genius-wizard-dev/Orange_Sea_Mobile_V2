import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

/**
 * Xin quyền truy cập vào thư viện ảnh
 * @returns {Promise<boolean>} - Trả về true nếu có quyền, false nếu không
 */
export const requestMediaLibraryPermissions = async () => {
    try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        return status === 'granted';
    } catch (error) {
        console.error('Lỗi khi xin quyền truy cập thư viện ảnh:', error);
        return false;
    }
};

/**
 * Lấy ảnh từ thư viện (sử dụng ImagePicker)
 * @returns {Promise<Object>}
 */
export const getAllPhotos = async () => {
    try {
        const hasPermission = await requestMediaLibraryPermissions();
        if (!hasPermission) {
            return { assets: [], hasPermission };
        }

        // Với expo-image-picker, không thể lấy trực tiếp tất cả ảnh như MediaLibrary
        // Thay vào đó, mô phỏng kết quả tương tự từ việc chọn ảnh
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            selectionLimit: 20,
            quality: 1,
            aspect: [4, 3],
            allowsEditing: false
        });

        if (result.canceled) {
            return { assets: [], hasPermission: true };
        }

        // Định dạng lại kết quả để tương thích với cấu trúc trước đây
        const assets = result.assets.map((asset, index) => ({
            id: `image-${index}-${new Date().getTime()}`,
            uri: asset.uri,
            width: asset.width,
            height: asset.height
        }));

        return { assets, hasPermission: true };
    } catch (error) {
        console.error('Lỗi khi lấy ảnh từ thư viện:', error);
        return { assets: [], hasPermission: false, error };
    }
};

/**
 * Chọn một ảnh từ thư viện
 * @returns {Promise<object|null>} - Thông tin ảnh đã chọn hoặc null nếu không chọn
 */
export const pickImage = async () => {
    try {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            return result.assets[0];
        }

        return null;
    } catch (error) {
        console.error('Lỗi khi chọn ảnh:', error);
        return null;
    }
};