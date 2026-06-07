import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity, useWindowDimensions, ToastAndroid, Platform, Alert } from 'react-native';
import { useLocalSearchParams, Stack, useRouter, useNavigation } from 'expo-router';
import { productApi } from '../../api/productApi';
import { formatCurrency } from '../../utils/format';
import { useCartStore } from '../../store/useCartStore';
import { useFavoriteStore } from '../../store/useFavoriteStore';
import { Colors, Spacing, Radius, Shadows, Gradients } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  const addToCart = useCartStore((state) => state.addToCart);
  
  const favoriteItems = useFavoriteStore((state) => state.items);
  const addFavorite = useFavoriteStore((state) => state.addFavorite);
  const removeFavorite = useFavoriteStore((state) => state.removeFavorite);
  const isFav = favoriteItems.some(item => item.id === (id as string));

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await productApi.getProductById(id as string);
        const data = res.data?.product || res.data || null;
        setProduct(data);
        if (data && data.variants && data.variants.length > 0) {
          setSelectedVariantId(data.variants[0].variant_id);
        }
      } catch (error) {
        console.error('Error fetching product detail:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.light.secondary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Sản phẩm không tồn tại</Text>
      </View>
    );
  }

  const currentVariant = product.variants?.find((v: any) => v.variant_id === selectedVariantId) || product.variants?.[0];
  
  const displayPrice = currentVariant?.discount_price || currentVariant?.original_price || product.min_price || product.price || 0;
  const originalPrice = currentVariant?.original_price || product.max_price || product.oldPrice || product.price || 0;
  const variantId = currentVariant?.variant_id || product.product_id;
  const stockQty = currentVariant?.stock_quantity || product.total_stock || 0;

  const variantImages = product.images?.filter((img: any) => img.variant_id === variantId) || [];
  let imageUrl = product.primary_product_image_url || 'https://via.placeholder.com/400';
  if (variantImages.length > 0) {
    imageUrl = variantImages[0].image_url;
  }
  if (imageUrl && imageUrl.startsWith('/uploads')) {
    imageUrl = `http://192.168.1.13:5000${imageUrl}`;
  }

  const handleAddToCart = () => {
    if (stockQty < 1) {
      Alert.alert('Hết hàng', 'Sản phẩm này hiện đang tạm hết hàng.');
      return;
    }
    
    let configSpec = '';
    if (currentVariant) {
      configSpec = [currentVariant.color_name, currentVariant.ram_gb ? `${currentVariant.ram_gb}GB RAM` : null, currentVariant.storage_gb ? `${currentVariant.storage_gb}GB ROM` : null].filter(Boolean).join(' - ');
    } else {
      configSpec = product.representative_storage_gb ? `${product.representative_storage_gb}GB` : '';
    }

    addToCart({
      id: `${product.product_id}-${variantId}`,
      productId: product.product_id,
      variantId: variantId,
      name: product.product_name || product.name,
      price: displayPrice,
      quantity: quantity,
      image: imageUrl,
      config: configSpec
    });

    if (Platform.OS === 'android') {
      ToastAndroid.show('Đã thêm vào giỏ hàng!', ToastAndroid.SHORT);
    } else {
      Alert.alert('Thành công', 'Đã thêm vào giỏ hàng!');
    }
  };

  const increaseQuantity = () => {
    if (quantity < stockQty) setQuantity(q => q + 1);
  };
  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(q => q - 1);
  };

  const toggleFavorite = () => {
    if (isFav) {
      removeFavorite(id as string);
    } else {
      addFavorite({
        id: id as string,
        productId: product?.product_id || Number(id),
        name: product?.product_name || product?.name,
        price: displayPrice,
        image: imageUrl
      });
      if (Platform.OS === 'android') {
        ToastAndroid.show('Đã lưu vào yêu thích', ToastAndroid.SHORT);
      }
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={toggleFavorite} style={{ padding: Spacing.sm }}>
          <Ionicons name={isFav ? "heart" : "heart-outline"} size={24} color={isFav ? Colors.light.danger : Colors.light.text} />
        </TouchableOpacity>
      )
    });
  }, [navigation, isFav, product]);

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Chi tiết sản phẩm',
        headerStyle: { backgroundColor: Colors.light.backgroundElement },
        headerTintColor: Colors.light.text,
      }} />
      <View style={styles.container}>
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: imageUrl }} 
              style={[styles.image, { width: width, height: width }]} 
              resizeMode="contain" 
            />
          </View>
          
          <View style={styles.infoContainer}>
            <Text style={styles.title}>{product.product_name || product.name}</Text>
            
            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatCurrency(displayPrice)}</Text>
              {originalPrice > displayPrice && (
                <Text style={styles.originalPrice}>{formatCurrency(originalPrice)}</Text>
              )}
            </View>
            
            <View style={styles.divider} />
            
            {product.variants && product.variants.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tùy chọn phiên bản</Text>
                <View style={styles.variantsContainer}>
                  {product.variants.map((v: any) => {
                    const isSelected = selectedVariantId === v.variant_id;
                    const vName = [v.color_name, v.ram_gb ? `${v.ram_gb}GB` : null, v.storage_gb ? `${v.storage_gb}GB` : null].filter(Boolean).join(' - ');
                    return (
                      <TouchableOpacity 
                        key={v.variant_id}
                        style={[styles.variantBtn, isSelected && styles.variantBtnActive]}
                        onPress={() => setSelectedVariantId(v.variant_id)}
                      >
                        <Text style={[styles.variantText, isSelected && styles.variantTextActive]}>{vName}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={[styles.section, styles.quantityRow]}>
              <Text style={styles.sectionTitle}>Số lượng</Text>
              <View style={styles.qtyBox}>
                <TouchableOpacity onPress={decreaseQuantity} style={styles.qtyBtn}>
                  <Ionicons name="remove" size={20} color={Colors.light.text} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{quantity}</Text>
                <TouchableOpacity onPress={increaseQuantity} style={styles.qtyBtn}>
                  <Ionicons name="add" size={20} color={Colors.light.text} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.stockText}>Kho: {stockQty} sản phẩm</Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.sectionTitle}>Cấu hình nổi bật</Text>
            <View style={styles.specBox}>
              {product.os ? <Text style={styles.specText}>• Hệ điều hành: {product.os}</Text> : null}
              {product.screen_size ? <Text style={styles.specText}>• Màn hình: {product.screen_size}</Text> : null}
              {product.weight_kg ? <Text style={styles.specText}>• Trọng lượng: {product.weight_kg} kg</Text> : null}
              {product.battery_capacity_mah ? <Text style={styles.specText}>• Pin: {product.battery_capacity_mah} mAh</Text> : null}
              {!product.os && !product.screen_size && <Text style={styles.specText}>Chưa có thông tin cấu hình chi tiết.</Text>}
            </View>

            {product.description ? (
              <View style={{ marginTop: Spacing.lg }}>
                <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
                <Text style={styles.descText}>{product.description}</Text>
              </View>
            ) : null}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
        
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.cartIconBtn}
            onPress={() => router.push('/cart')}
          >
            <Ionicons name="cart-outline" size={28} color={Colors.light.primary} />
            <Text style={styles.cartIconText}>Giỏ hàng</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.addToCartBtnWrapper}
            activeOpacity={0.8}
            onPress={handleAddToCart}
          >
            <LinearGradient
              colors={Gradients.hero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addToCartBtn}
            >
              <Text style={styles.btnText}>Thêm vào giỏ</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: Colors.light.textSecondary },
  scrollContent: { flex: 1 },
  imageContainer: {
    backgroundColor: Colors.light.white,
    paddingBottom: Spacing.md,
  },
  image: { backgroundColor: Colors.light.white },
  infoContainer: { 
    padding: Spacing.lg, 
    backgroundColor: Colors.light.backgroundElement, 
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    marginTop: -Radius.xl,
    ...Shadows.medium,
  },
  title: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: Colors.light.text, 
    marginBottom: Spacing.md,
    lineHeight: 28,
  },
  priceRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
  },
  price: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: Colors.light.danger, 
    marginRight: Spacing.md 
  },
  originalPrice: { 
    fontSize: 16, 
    color: Colors.light.textSecondary, 
    textDecorationLine: 'line-through', 
    marginBottom: 4 
  },
  divider: { 
    height: 1, 
    backgroundColor: Colors.light.border, 
    marginVertical: Spacing.lg 
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    marginBottom: Spacing.sm, 
    color: Colors.light.text 
  },
  variantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  variantBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  variantBtnActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '10',
  },
  variantText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  variantTextActive: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.sm,
  },
  qtyBtn: {
    padding: Spacing.sm,
    backgroundColor: Colors.light.background,
  },
  qtyText: {
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    fontWeight: '600',
  },
  stockText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'right',
  },
  specBox: { 
    backgroundColor: Colors.light.backgroundSelected, 
    padding: Spacing.md, 
    borderRadius: Radius.md 
  },
  specText: { 
    fontSize: 14, 
    color: Colors.light.text, 
    marginBottom: 6,
    lineHeight: 22,
  },
  descText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 24,
  },
  bottomBar: { 
    flexDirection: 'row',
    padding: Spacing.lg, 
    backgroundColor: Colors.light.backgroundElement, 
    borderTopWidth: 1, 
    borderTopColor: Colors.light.border,
    paddingBottom: Platform.OS === 'ios' ? 32 : Spacing.lg,
    alignItems: 'center',
    ...Shadows.medium,
  },
  cartIconBtn: {
    padding: Spacing.sm,
    marginRight: Spacing.lg,
    alignItems: 'center',
  },
  cartIconText: {
    fontSize: 10,
    color: Colors.light.primary,
    marginTop: 2,
    fontWeight: '600'
  },
  addToCartBtnWrapper: { 
    flex: 1, 
    borderRadius: Radius.pill,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  addToCartBtn: { 
    height: 56, 
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  btnText: { color: Colors.light.white, fontSize: 16, fontWeight: '800' },
});
