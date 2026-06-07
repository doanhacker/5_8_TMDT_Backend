import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { productApi } from '../../api/productApi';
import { categoryApi } from '../../api/categoryApi';
import ProductCard from '../../components/ProductCard';
import { Colors, Gradients, Radius, Shadows, Spacing } from '../../constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          productApi.getProducts({ limit: 10 }),
          categoryApi.getAllCategories(),
        ]);
        
        setProducts(productsRes.data || productsRes || []);
        setCategories(categoriesRes.data || categoriesRes || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.light.secondary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* App Header */}
      <View style={styles.appHeader}>
        <Text style={styles.brandName}>Tech Mart</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
      <View style={styles.bannerContainer}>
        <LinearGradient
          colors={Gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerContent}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🔥 HOT SALE</Text>
            </View>
            <Text style={styles.bannerText}>Siêu Sale Mùa Hè</Text>
            <Text style={styles.bannerSubText}>Giảm giá lên đến 50% cho tất cả sản phẩm</Text>
            <TouchableOpacity style={styles.bannerBtn} activeOpacity={0.8} onPress={() => router.push('/catalog')}>
              <Text style={styles.bannerBtnText}>Khám phá ngay</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.light.primary} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Danh mục */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Danh Mục</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat: any) => (
            <TouchableOpacity 
              key={cat.category_id} 
              style={styles.categoryItem} 
              activeOpacity={0.7}
              onPress={() => router.push(`/catalog?category=${cat.category_id}`)}
            >
              <LinearGradient
                colors={Gradients.card}
                style={styles.categoryCircle}
              >
                <Text style={styles.categoryInitial}>
                  {cat.category_name ? cat.category_name.charAt(0).toUpperCase() : '?'}
                </Text>
              </LinearGradient>
              <Text style={styles.categoryText} numberOfLines={1}>{cat.category_name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sản phẩm nổi bật */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sản Phẩm Mới</Text>
          <TouchableOpacity onPress={() => router.push('/catalog')} style={styles.seeAllBtn}>
            <Text style={styles.seeAll}>Xem tất cả</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.light.secondary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.productGrid}>
          {products.length > 0 ? (
            products.map((item: any) => (
              <ProductCard 
                key={item.product_id} 
                product={item} 
                onPress={() => router.push(`/product/${item.product_id}`)} 
              />
            ))
          ) : (
            <Text style={styles.emptyText}>Chưa có sản phẩm nào</Text>
          )}
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.light.background 
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 50, // SafeArea padding
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.light.backgroundElement,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.light.primary,
    letterSpacing: -0.5,
  },
  scrollContainer: {
    flex: 1,
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: Colors.light.background
  },
  bannerContainer: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  banner: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  bannerContent: {
    padding: Spacing.xl,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    marginBottom: Spacing.md,
  },
  badgeText: {
    color: Colors.light.white,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  bannerText: { 
    color: Colors.light.white, 
    fontSize: 28, 
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  bannerSubText: { 
    color: 'rgba(255,255,255,0.8)', 
    fontSize: 14, 
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  bannerBtn: {
    backgroundColor: Colors.light.white,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
    gap: Spacing.xs,
  },
  bannerBtnText: {
    color: Colors.light.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  section: { 
    paddingHorizontal: Spacing.lg, 
    marginBottom: Spacing.xxl 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: Spacing.lg 
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: Colors.light.text 
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAll: { 
    color: Colors.light.secondary, 
    fontSize: 14,
    fontWeight: '600',
  },
  categoryScroll: { 
    paddingRight: Spacing.lg,
  },
  categoryItem: { 
    alignItems: 'center', 
    marginRight: Spacing.xl, 
    width: 64 
  },
  categoryCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.light,
  },
  categoryInitial: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: Colors.light.secondary 
  },
  categoryText: { 
    fontSize: 12, 
    color: Colors.light.textSecondary, 
    textAlign: 'center',
    fontWeight: '500',
  },
  productGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  emptyText: { 
    color: Colors.light.textSecondary, 
    fontSize: 14, 
    textAlign: 'center', 
    width: '100%',
    marginTop: Spacing.xl,
  },
});
