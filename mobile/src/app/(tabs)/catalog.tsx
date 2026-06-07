import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { productApi } from '../../api/productApi';
import ProductCard from '../../components/ProductCard';
import { Colors, Radius, Spacing, Shadows } from '../../constants/theme';

export default function CatalogScreen() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { category } = useLocalSearchParams();
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      // Luôn lấy danh mục trước (hoặc lấy song song nếu null)
      if (categories.length === 0) {
        try {
          const catRes = await productApi.getProductCategories();
          setCategories(catRes.data?.categories || catRes.data || []);
        } catch (e) {
          console.error(e);
        }
      }
      
      if (category) {
        const catId = Number(category);
        fetchProductsByCategory(catId);
      } else {
        fetchData();
      }
    };
    init();
  }, [category]);

  const fetchData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        productApi.getProductCategories(),
        productApi.getProducts({ limit: 50 })
      ]);
      setCategories(catRes.data?.categories || catRes.data || []);
      setProducts(prodRes.data?.products || prodRes.data || []);
    } catch (error) {
      console.error('Error fetching catalog:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsByCategory = async (categoryId: number | null) => {
    setActiveCategoryId(categoryId);
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (categoryId) params.categoryId = categoryId;
      const res = await productApi.getProducts(params);
      setProducts(res.data?.products || res.data || []);
    } catch (error) {
      console.error('Error fetching products by category:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={Colors.light.textSecondary} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Tìm kiếm sản phẩm..."
          placeholderTextColor={Colors.light.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <TouchableOpacity 
          style={[styles.filterPill, activeCategoryId === null && styles.filterPillActive]}
          onPress={() => fetchProductsByCategory(null)}
        >
          <Text style={[styles.filterText, activeCategoryId === null && styles.filterTextActive]}>Tất cả</Text>
        </TouchableOpacity>
        
        {categories.map((cat) => (
          <TouchableOpacity 
            key={cat.category_id} 
            style={[styles.filterPill, activeCategoryId === cat.category_id && styles.filterPillActive]}
            onPress={() => fetchProductsByCategory(cat.category_id)}
          >
            <Text style={[styles.filterText, activeCategoryId === cat.category_id && styles.filterTextActive]}>
              {cat.category_name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.light.secondary} />
      </View>
    );
  }

  // Lọc sản phẩm tạm thời (Client side)
  const filteredProducts = products.filter((p: any) => 
    (p.product_name || p.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item: any) => item.product_id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ProductCard 
            product={item} 
            onPress={() => router.push(`/product/${item.product_id}`)} 
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={Colors.light.border} />
            <Text style={styles.emptyText}>Không tìm thấy sản phẩm nào</Text>
          </View>
        }
      />
    </View>
  );
}

import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background },
  headerContainer: {
    padding: Spacing.lg,
    backgroundColor: Colors.light.backgroundElement,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundSelected,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 15,
    color: Colors.light.text,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginRight: Spacing.sm,
    backgroundColor: Colors.light.backgroundElement,
  },
  filterPillActive: {
    backgroundColor: Colors.light.secondary,
    borderColor: Colors.light.secondary,
  },
  filterText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.light.white,
    fontWeight: '600',
  },
  list: { padding: Spacing.lg },
  row: { justifyContent: 'space-between' },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: { textAlign: 'center', marginTop: Spacing.md, color: Colors.light.textSecondary, fontSize: 14 },
});
