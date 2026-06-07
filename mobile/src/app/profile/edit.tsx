import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Gradients, Shadows } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import axiosClient from '../../api/axiosClient';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setAuth, token } = useAuthStore();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleUpdateProfile = async () => {
    if (!fullName) {
      Alert.alert('Lỗi', 'Họ tên không được để trống');
      return;
    }
    setLoadingProfile(true);
    try {
      const res = await axiosClient.put('/user-profile', { 
        full_name: fullName, 
        phone_number: phoneNumber 
      });
      if (res.success || res.message) {
        Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân!');
        // Update user in local store
        if (user && token) {
          setAuth({ ...user, full_name: fullName, phone_number: phoneNumber }, token);
        }
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể cập nhật thông tin');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu cũ và mới');
      return;
    }
    setLoadingPassword(true);
    try {
      const res = await axiosClient.put('/user-profile/change-password', { 
        oldPassword, 
        newPassword 
      });
      if (res.success || res.message) {
        Alert.alert('Thành công', 'Đã thay đổi mật khẩu!');
        setOldPassword('');
        setNewPassword('');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoadingPassword(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Bạn cần đăng nhập</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Cài đặt tài khoản',
        headerStyle: { backgroundColor: Colors.light.backgroundElement },
        headerTintColor: Colors.light.text,
      }} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ và tên</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập họ tên"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số điện thoại</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập số điện thoại"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputWrapper, { backgroundColor: Colors.light.backgroundSelected }]}>
              <Ionicons name="mail-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: Colors.light.textSecondary }]}
                value={user.email}
                editable={false}
              />
            </View>
            <Text style={styles.helperText}>Email không thể thay đổi</Text>
          </View>

          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={handleUpdateProfile}
            disabled={loadingProfile}
            style={styles.btnWrapper}
          >
            <LinearGradient
              colors={Gradients.hero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btn}
            >
              {loadingProfile ? (
                <ActivityIndicator color={Colors.light.white} />
              ) : (
                <Text style={styles.btnText}>Lưu thông tin</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { padding: Spacing.xl },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: Colors.light.text, marginBottom: Spacing.lg },
  inputGroup: { marginBottom: Spacing.lg },
  label: { fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: Spacing.sm },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 50,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, fontSize: 15, color: Colors.light.text },
  eyeIcon: { padding: Spacing.sm },
  helperText: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 4 },
  btnWrapper: { borderRadius: Radius.pill, overflow: 'hidden', ...Shadows.medium },
  btn: { height: 50, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: Colors.light.white, fontSize: 16, fontWeight: '800' },
  divider: { height: 8, backgroundColor: Colors.light.border },
});
