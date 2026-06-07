import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadows } from '../../constants/theme';
import { useFavoriteStore } from '../../store/useFavoriteStore';
import { formatCurrency } from '../../utils/format';

export default function FavoritesScreen() {
  const router = useRouter();
  const { items, removeFavorite } = useFavoriteStore();

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={80} color={Colors.light.danger + '80'} />
      <Text style={styles.title}>Chưa có sản phẩm yêu thích</Text>
      <Text style={styles.subtitle}>Hãy thả tim cho những sản phẩm bạn thích để lưu lại đây nhé!</Text>
      
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => router.push('/catalog')}
        style={styles.btn}
      >
        <Text style={styles.btnText}>Khám phá ngay</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Sản phẩm yêu thích',
        headerStyle: { backgroundColor: Colors.light.backgroundElement },
        headerTintColor: Colors.light.text,
      }} />
      <View style={styles.container}>
        {items.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => router.push(`/product/${item.productId}`)}
              >
                <Image source={{ uri: item.image }} style={styles.image} resizeMode="contain" />
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.price}>{formatCurrency(item.price)}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.removeBtn}
                  onPress={() => removeFavorite(item.id)}
                >
                  <Ionicons name="heart-dislike-outline" size={24} color={Colors.light.danger} />
                </TouchableOpacity>
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  title: { 
    fontSize: 20, 
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
    lineHeight: 22,
  },
  btn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
  },
  btnText: {
    color: Colors.light.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  list: {
    padding: Spacing.lg,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.light,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.white,
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.danger,
  },
  removeBtn: {
    padding: Spacing.sm,
  }
});
