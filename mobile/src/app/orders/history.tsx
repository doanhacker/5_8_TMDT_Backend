import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { orderApi } from '../../api/orderApi';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors, Spacing, Radius, Shadows } from '../../constants/theme';
import { formatCurrency } from '../../utils/format';

export default function OrderHistoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      // Backend usually gets user id from token or expects user_id param
      const res = await orderApi.getOrders({ user_id: user.id || user.user_id });
      if (res.data) {
        setOrders(res.data.orders || res.data);
      }
    } catch (error) {
      console.error('Lỗi tải đơn hàng', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_CONFIRMATION': return Colors.light.warning;
      case 'PROCESSING': return Colors.light.primary;
      case 'SHIPPING': return Colors.light.secondary;
      case 'COMPLETED': return Colors.light.success;
      case 'CANCELLED': return Colors.light.danger;
      default: return Colors.light.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING_CONFIRMATION': return 'Chờ xác nhận';
      case 'WAITING_FOR_STOCK': return 'Chờ hàng';
      case 'PROCESSING': return 'Đang xử lý';
      case 'SHIPPING': return 'Đang giao';
      case 'COMPLETED': return 'Hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Ionicons name="lock-closed-outline" size={64} color={Colors.light.textSecondary} />
        <Text style={styles.emptyText}>Vui lòng đăng nhập để xem lịch sử đơn hàng</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/auth/login')}>
          <Text style={styles.loginBtnText}>Đăng nhập ngay</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Lịch sử đơn hàng',
        headerStyle: { backgroundColor: Colors.light.backgroundElement },
        headerTintColor: Colors.light.text,
      }} />
      <View style={styles.container}>
        {orders.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="receipt-outline" size={64} color={Colors.light.textSecondary} />
            <Text style={styles.emptyText}>Bạn chưa có đơn hàng nào</Text>
            <TouchableOpacity style={styles.continueBtn} onPress={() => router.push('/')}>
              <Text style={styles.continueBtnText}>Tiếp tục mua sắm</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.order_id?.toString() || Math.random().toString()}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.orderCard} 
                activeOpacity={0.7}
                onPress={() => router.push(`/orders/${item.order_id}`)}
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>Đơn hàng #{item.order_id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                      {getStatusText(item.status)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.orderBody}>
                  <Text style={styles.orderDate}>
                    Ngày đặt: {new Date(item.order_date).toLocaleDateString('vi-VN')}
                  </Text>
                  <Text style={styles.orderTotal}>
                    Tổng tiền: <Text style={styles.totalValue}>{formatCurrency(item.total_amount)}</Text>
                  </Text>
                </View>

                <View style={styles.orderFooter}>
                  <Text style={styles.detailText}>Xem chi tiết</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.light.primary} />
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  list: { padding: Spacing.md },
  orderCard: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.light,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  orderId: { fontSize: 16, fontWeight: '700', color: Colors.light.text },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.pill },
  statusText: { fontSize: 12, fontWeight: '700' },
  orderBody: { marginBottom: Spacing.sm },
  orderDate: { fontSize: 14, color: Colors.light.textSecondary, marginBottom: 4 },
  orderTotal: { fontSize: 14, color: Colors.light.text },
  totalValue: { fontWeight: '800', color: Colors.light.danger },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  detailText: { fontSize: 14, color: Colors.light.primary, fontWeight: '600', marginRight: 4 },
  emptyText: { fontSize: 16, color: Colors.light.textSecondary, marginTop: Spacing.lg, marginBottom: Spacing.xl },
  loginBtn: { backgroundColor: Colors.light.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.pill },
  loginBtnText: { color: Colors.light.white, fontWeight: '700', fontSize: 16 },
  continueBtn: { backgroundColor: Colors.light.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.pill },
  continueBtnText: { color: Colors.light.white, fontWeight: '700', fontSize: 16 },
});
