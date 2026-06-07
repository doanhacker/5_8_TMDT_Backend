import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Alert, Platform, ToastAndroid, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Spacing, Gradients, Shadows } from '../../constants/theme';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { orderApi } from '../../api/orderApi';
import { formatCurrency } from '../../utils/format';

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = () => {
    if (items.length === 0) return;
    
    if (!user) {
      Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để tiến hành thanh toán.', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/auth/login') }
      ]);
      return;
    }

    Alert.alert(
      'Xác nhận đặt hàng',
      `Bạn có muốn đặt mua đơn hàng trị giá ${formatCurrency(getTotalPrice())}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đặt hàng', 
          onPress: submitOrder
        }
      ]
    );
  };

  const submitOrder = async () => {
    setIsCheckingOut(true);
    try {
      const orderItems = items.map(item => ({
        variant_id: item.variantId || item.productId, // Fallback if no variant
        quantity: item.quantity
      }));

      const res = await orderApi.createOrder({
        user_id: user?.id || user?.user_id || 1, // Dùng fallback 1 nếu backend cấu trúc user khác
        order_type: 'NORMAL',
        items: orderItems
      });

      if (res.success || res.data?.order_id) {
        clearCart();
        if (Platform.OS === 'android') {
          ToastAndroid.show('Đặt hàng thành công!', ToastAndroid.LONG);
        } else {
          Alert.alert('Thành công', 'Đặt hàng thành công!');
        }
        router.push('/orders/history');
      } else {
        Alert.alert('Lỗi', res.message || 'Thanh toán thất bại');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cart-outline" size={80} color={Colors.light.textSecondary} />
      <Text style={styles.title}>Giỏ Hàng Của Bạn</Text>
      <Text style={styles.subtitle}>Giỏ hàng đang trống, hãy thêm sản phẩm nhé!</Text>
      
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => router.push('/catalog')}
        style={styles.btnWrapper}
      >
        <LinearGradient
          colors={Gradients.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.btn}
        >
          <Text style={styles.btnText}>Tiếp tục mua sắm</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (items.length === 0) {
    return <View style={styles.container}>{renderEmptyCart()}</View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Giỏ Hàng</Text>
        <TouchableOpacity onPress={() => clearCart()}>
          <Text style={styles.clearText}>Xóa tất cả</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="contain" />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              {item.config ? <Text style={styles.itemConfig}>{item.config}</Text> : null}
              <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
              
              <View style={styles.itemActionRow}>
                <View style={styles.quantityControl}>
                  <TouchableOpacity 
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Ionicons name="remove" size={16} color={Colors.light.text} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity 
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Ionicons name="add" size={16} color={Colors.light.text} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={styles.removeBtn}
                  onPress={() => removeFromCart(item.id)}
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.light.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng cộng:</Text>
          <Text style={styles.totalValue}>{formatCurrency(getTotalPrice())}</Text>
        </View>
        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={handleCheckout} 
          disabled={isCheckingOut}
          style={styles.checkoutBtnWrapper}
        >
          <LinearGradient
            colors={Gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.checkoutBtn}
          >
            {isCheckingOut ? (
              <ActivityIndicator color={Colors.light.white} />
            ) : (
              <Text style={styles.checkoutBtnText}>Thanh toán ngay</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 50 : Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.light.backgroundElement,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.text,
  },
  clearText: {
    color: Colors.light.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  title: { 
    fontSize: 22, 
    fontWeight: '800', 
    marginTop: Spacing.lg, 
    marginBottom: Spacing.sm, 
    color: Colors.light.text 
  },
  subtitle: { 
    fontSize: 14, 
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  btnWrapper: {
    width: '100%',
    maxWidth: 300,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  btn: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  btnText: {
    color: Colors.light.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  list: {
    padding: Spacing.lg,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.light,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.white,
  },
  itemInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  itemConfig: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.danger,
    marginBottom: Spacing.sm,
  },
  itemActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSelected,
    borderRadius: Radius.pill,
  },
  qtyBtn: {
    padding: 8,
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '700',
    marginHorizontal: Spacing.md,
  },
  removeBtn: {
    padding: Spacing.xs,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.light.backgroundElement,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  totalLabel: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.light.danger,
  },
  checkoutBtnWrapper: {
    borderRadius: Radius.pill,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  checkoutBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: Colors.light.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
