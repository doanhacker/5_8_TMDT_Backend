import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/format';
import { Colors, Radius, Shadows, Spacing } from '../constants/theme';

interface ProductCardProps {
  product: any;
  onPress: () => void;
}

export default function ProductCard({ product, onPress }: ProductCardProps) {
  // Lấy ảnh chính của sản phẩm
  const imageUrl = product.primary_product_image_url || 'https://via.placeholder.com/150';
  
  // Lấy giá thấp nhất từ các biến thể (nếu có)
  let displayPrice = 0;
  let originalPrice = 0;
  let stockQuantity = product.total_stock_quantity || 0;
  
  if (product.variants && product.variants.length > 0) {
    displayPrice = product.variants[0].discount_price || product.variants[0].original_price;
    originalPrice = product.variants[0].original_price;
    stockQuantity = product.variants[0].stock_quantity || stockQuantity;
  } else {
    displayPrice = product.min_price || product.price || 0;
    originalPrice = product.max_price || product.oldPrice || product.price || 0;
  }

  const discountPercent = originalPrice > displayPrice 
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) 
    : 0;

  // Lấy cấu hình tiêu biểu (Ví dụ: RAM, ROM)
  const configSpec = product.representative_storage_gb 
    ? `${product.representative_storage_gb}GB` 
    : product.storage;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
        {discountPercent > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPercent}%</Text>
          </View>
        )}
      </View>
      
      <View style={styles.infoContainer}>
        {configSpec && (
          <View style={styles.tagsContainer}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{configSpec}</Text>
            </View>
          </View>
        )}
        
        <Text style={styles.name} numberOfLines={2}>{product.product_name || product.name}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatCurrency(displayPrice)}</Text>
          {originalPrice > displayPrice && (
            <Text style={styles.originalPrice}>{formatCurrency(originalPrice)}</Text>
          )}
        </View>

        <View style={styles.footerRow}>
          <View style={styles.stockInfo}>
            <Ionicons name="flash" size={12} color={stockQuantity > 0 ? Colors.light.success : Colors.light.textSecondary} />
            <Text style={[styles.stockText, { color: stockQuantity > 0 ? Colors.light.success : Colors.light.textSecondary }]}>
              {stockQuantity > 0 ? 'Còn hàng' : 'Hết hàng'}
            </Text>
          </View>
          <TouchableOpacity style={styles.cartBtn} activeOpacity={0.7} onPress={(e) => {
            e.stopPropagation();
            // Xử lý thêm vào giỏ hàng tại đây (nếu có prop onAddToCart)
          }}>
            <Ionicons name="cart" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radius.lg,
    width: '48%',
    marginBottom: Spacing.lg,
    ...Shadows.light,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.light.white,
    position: 'relative',
    padding: Spacing.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: Colors.light.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    ...Shadows.light,
  },
  discountText: {
    color: Colors.light.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.light.backgroundElement,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.light.backgroundSelected,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  tagText: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  name: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    height: 36, // Fixed height for 2 lines
    lineHeight: 18,
  },
  priceContainer: {
    flexDirection: 'column',
    marginBottom: Spacing.md,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.danger,
  },
  originalPrice: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: Spacing.sm,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '500',
  },
  cartBtn: {
    backgroundColor: Colors.light.primary,
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.light,
  },
});
