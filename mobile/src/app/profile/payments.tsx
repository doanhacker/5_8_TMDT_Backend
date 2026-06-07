import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadows } from '../../constants/theme';

export default function PaymentsScreen() {
  const paymentMethods = [
    { id: 1, name: 'Thanh toán khi nhận hàng (COD)', icon: 'cash-outline', color: Colors.light.success },
    { id: 2, name: 'Thẻ tín dụng / Ghi nợ', icon: 'card-outline', color: Colors.light.primary },
    { id: 3, name: 'Ví điện tử ZaloPay / MoMo', icon: 'wallet-outline', color: Colors.light.secondary },
  ];

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Phương thức thanh toán',
        headerStyle: { backgroundColor: Colors.light.backgroundElement },
        headerTintColor: Colors.light.text,
      }} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.emptyState}>
          <View style={styles.iconCircle}>
            <Ionicons name="card" size={40} color={Colors.light.primary} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có thẻ nào được liên kết</Text>
          <Text style={styles.emptySubtitle}>
            Hệ thống thanh toán của Tech Mart hiện đang tích hợp trực tiếp qua Cổng thanh toán. Bạn có thể chọn hình thức khi Đặt hàng.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Các hình thức được hỗ trợ</Text>
          {paymentMethods.map(method => (
            <View key={method.id} style={styles.methodCard}>
              <View style={[styles.methodIcon, { backgroundColor: method.color + '15' }]}>
                <Ionicons name={method.icon as any} size={24} color={method.color} />
              </View>
              <Text style={styles.methodName}>{method.name}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.light.backgroundElement,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.light.text, marginBottom: Spacing.sm },
  emptySubtitle: { fontSize: 14, color: Colors.light.textSecondary, textAlign: 'center', lineHeight: 22 },
  
  section: { padding: Spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.light.text, marginBottom: Spacing.lg },
  methodCard: {
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
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  methodName: { fontSize: 15, fontWeight: '600', color: Colors.light.text },
});
