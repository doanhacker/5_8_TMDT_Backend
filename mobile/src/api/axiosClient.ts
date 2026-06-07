import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import { Platform } from 'react-native';

// NOTE: Đối với Mobile App, 'localhost' sẽ trỏ về chính thiết bị mobile.
// Để gọi API đến máy tính chạy Backend, chúng ta cần:
// - Nếu dùng Android Emulator: dùng '10.0.2.2'
// - Nếu dùng máy thật (chạy Expo Go): dùng địa chỉ IP LAN của máy tính (vd: 192.168.1.X)
// Backend của bạn đang chạy ở PORT=5000 theo file .env
const HOST = '192.168.1.13'; // IP LAN của máy tính
export const BASE_URL = `http://${HOST}:5000/api`;

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Timeout 10s
  timeout: 10000,
});

// Interceptor cho Request: Gắn token vào mỗi request nếu đã đăng nhập
axiosClient.interceptors.request.use(
  async (config) => {
    try {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Lỗi khi lấy token từ SecureStore:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor cho Response: Xử lý lỗi token hết hạn (401), v.v.
axiosClient.interceptors.response.use(
  (response) => {
    // Trả về trực tiếp data thay vì object response nguyên gốc
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
  (error) => {
    // Xử lý các mã lỗi ở đây (vd: 401 Unauthorized -> Đẩy về trang đăng nhập)
    if (error.response?.status === 401) {
      console.log('Token hết hạn hoặc không hợp lệ!');
      // Gọi action logout của store để xóa token lỗi khỏi SecureStore
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
