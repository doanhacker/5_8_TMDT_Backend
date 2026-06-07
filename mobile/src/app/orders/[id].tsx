import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { orderApi } from '../../api/orderApi';
import { Colors, Spacing, Radius, Shadows } from '../../constants/theme';
import { formatCurrency } from '../../utils/format';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      const res = await orderApi.getOrderDetail(id as string);
      if (res.data) {
        setOrder(res.data.order || res.data);
      }
    } catch (error) {
      console.error('Lỗi tải chi tiết đơn hàng', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING_CONFIRMATION': return 'Chờ xác nhận';
      case 'WAITING_FOR_STOCK': return 'Chờ hàng';
      case 'PROCESSING': return 'Đang xử lý';
      case 'SHIPPING': return 'Đang giao hàng';
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

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Không tìm thấy thông tin đơn hàng</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ 
        title: `Đơn hàng #${order.order_id || id}`,
        headerStyle: { backgroundColor: Colors.light.backgroundElement },
        headerTintColor: Colors.light.text,
      }} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trạng thái đơn hàng</Text>
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          <Text style={styles.dateText}>Ngày đặt: {new Date(order.order_date).toLocaleString('vi-VN')}</Text>
        </View>

        {/* Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
          {order.specific_address ? (
            <>
              <Text style={[styles.normalText, { fontWeight: 'bold', marginBottom: 4 }]}>
                {order.receiver_name} - {order.receiver_phone}
              </Text>
              <Text style={styles.normalText}>{order.specific_address}</Text>
              <Text style={styles.normalText}>{order.ward}, {order.district}, {order.province}</Text>
            </>
          ) : (
            <Text style={styles.normalText}>Chưa có thông tin giao hàng chi tiết</Text>
          )}
        </View>

        {/* Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sản phẩm đã đặt</Text>
          {order.details && order.details.map((item: any, index: number) => {
            const attrs = [item.color_name, item.ram_gb ? `${item.ram_gb}GB RAM` : '', item.storage_gb ? `${item.storage_gb}GB ROM` : '']
              .filter(Boolean)
              .join(', ');

            return (
              <View key={index} style={styles.itemRow}>
                <Image 
                  source={{ uri: item.primary_variant_image_url ? `http://192.168.1.13:5000${item.primary_variant_image_url}` : 'https://via.placeholder.com/60' }} 
                  style={styles.itemImage} 
                  resizeMode="contain" 
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.product_name}</Text>
                  {attrs ? <Text style={styles.itemConfig}>{attrs}</Text> : null}
                  <View style={styles.priceRow}>
                    <Text style={styles.itemPrice}>{formatCurrency(item.price_at_purchase)}</Text>
                    <Text style={styles.itemQty}>x{item.quantity}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thanh toán</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính</Text>
            <Text style={styles.summaryValue}>{formatCurrency(order.total_amount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
            <Text style={styles.summaryValue}>Miễn phí</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalFinal}>{formatCurrency(order.total_amount)}</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: Colors.light.textSecondary },
  section: {
    backgroundColor: Colors.light.backgroundElement,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    ...Shadows.light,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.light.text, marginBottom: Spacing.md },
  statusText: { fontSize: 18, fontWeight: 'bold', color: Colors.light.primary, marginBottom: 4 },
  dateText: { fontSize: 14, color: Colors.light.textSecondary },
  normalText: { fontSize: 15, color: Colors.light.text, lineHeight: 22 },
  
  itemRow: { flexDirection: 'row', marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  itemImage: { width: 60, height: 60, borderRadius: Radius.sm, backgroundColor: Colors.light.background, marginRight: Spacing.md },
  itemInfo: { flex: 1, justifyContent: 'center' },
  itemName: { fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 4 },
  itemConfig: { fontSize: 12, color: Colors.light.textSecondary, marginBottom: 4 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemPrice: { fontSize: 15, fontWeight: '700', color: Colors.light.danger },
  itemQty: { fontSize: 14, color: Colors.light.textSecondary },
  
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  summaryLabel: { fontSize: 14, color: Colors.light.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '500', color: Colors.light.text },
  totalRow: { marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.light.border },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text },
  totalFinal: { fontSize: 18, fontWeight: '900', color: Colors.light.danger },
});
