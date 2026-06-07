import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Radius, Spacing, Shadows, Gradients } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => {
        logout();
        router.replace('/(tabs)/profile');
      } }
    ]);
  };

  const menuItems = [
    { icon: 'time-outline', label: 'Lịch sử đơn hàng', color: Colors.light.accent, authRequired: true },
    { icon: 'location-outline', label: 'Sổ địa chỉ', color: Colors.light.success, authRequired: true },
    { icon: 'card-outline', label: 'Phương thức thanh toán', color: Colors.light.secondary, authRequired: true },
    { icon: 'heart-outline', label: 'Sản phẩm yêu thích', color: Colors.light.danger, authRequired: false },
    { icon: 'settings-outline', label: 'Cài đặt tài khoản', color: Colors.light.textSecondary, authRequired: false },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={Gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.full_name || 'Guest'}&background=random` }} 
              style={styles.avatar}
            />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user ? user.full_name : 'Khách vãng lai'}</Text>
            {user ? (
              <Text style={styles.userEmail}>{user.email}</Text>
            ) : (
              <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/auth/login')}>
                <Text style={styles.loginBtnText}>Đăng nhập / Đăng ký</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => {
          // Chỉ hiện những menu yêu cầu đăng nhập nếu user đã đăng nhập
          if (item.authRequired && !user) return null;

          return (
            <TouchableOpacity 
              key={index} 
              style={styles.menuItem} 
              activeOpacity={0.7}
              onPress={() => {
                if (item.label === 'Lịch sử đơn hàng') {
                  router.push('/orders/history');
                } else if (item.label === 'Cài đặt tài khoản') {
                  router.push('/profile/edit');
                } else if (item.label === 'Sổ địa chỉ') {
                  router.push('/profile/addresses');
                } else if (item.label === 'Phương thức thanh toán') {
                  router.push('/profile/payments');
                } else if (item.label === 'Sản phẩm yêu thích') {
                  router.push('/profile/favorites');
                }
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.border} />
            </TouchableOpacity>
          );
        })}

        {user && (
          <TouchableOpacity 
            style={[styles.menuItem, styles.logoutItem]} 
            activeOpacity={0.7}
            onPress={handleLogout}
          >
            <View style={[styles.iconBox, { backgroundColor: Colors.light.danger + '15' }]}>
              <Ionicons name="log-out-outline" size={22} color={Colors.light.danger} />
            </View>
            <Text style={[styles.menuLabel, { color: Colors.light.danger, fontWeight: 'bold' }]}>Đăng xuất</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.light.background 
  },
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    ...Shadows.medium,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.light.white,
    padding: 3,
    ...Shadows.light,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
  },
  userInfo: {
    marginLeft: Spacing.lg,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.sm,
  },
  loginBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  loginBtnText: {
    color: Colors.light.white,
    fontSize: 12,
    fontWeight: '600',
  },
  menuContainer: {
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundElement,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.light,
  },
  logoutItem: {
    marginTop: Spacing.xl,
    borderColor: Colors.light.danger + '40',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.text,
  },
});
