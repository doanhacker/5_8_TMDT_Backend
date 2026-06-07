import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView, Modal } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadows, Gradients } from '../../constants/theme';
import { userProfileApi } from '../../api/userProfileApi';
import { useAuthStore } from '../../store/useAuthStore';
import { LinearGradient } from 'expo-linear-gradient';

export default function AddressesScreen() {
  const { user } = useAuthStore();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [receiverName, setReceiverName] = useState(user?.full_name || '');
  const [receiverPhone, setReceiverPhone] = useState(user?.phone_number || '');
  const [specificAddress, setSpecificAddress] = useState('');
  const [ward, setWard] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('');

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await userProfileApi.getMyAddresses();
      if (res.data) {
        setAddresses(res.data.addresses || res.data);
      }
    } catch (error) {
      console.error('Lỗi tải sổ địa chỉ', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa địa chỉ này?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Xóa', 
        style: 'destructive',
        onPress: async () => {
          try {
            await userProfileApi.deleteMyAddress(id);
            fetchAddresses();
            Alert.alert('Thành công', 'Đã xóa địa chỉ');
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa địa chỉ');
          }
        }
      }
    ]);
  };

  const handleAddAddress = async () => {
    if (!receiverName || !receiverPhone || !specificAddress || !ward || !district || !province) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }
    setIsSubmitting(true);
    try {
      await userProfileApi.createMyAddress({
        receiver_name: receiverName,
        receiver_phone: receiverPhone,
        specific_address: specificAddress,
        ward,
        district,
        province,
        is_default: addresses.length === 0 // Make default if it's the first one
      });
      Alert.alert('Thành công', 'Đã thêm địa chỉ mới');
      setShowModal(false);
      setSpecificAddress(''); setWard(''); setDistrict(''); setProvince('');
      fetchAddresses();
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể thêm địa chỉ');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Sổ địa chỉ',
        headerStyle: { backgroundColor: Colors.light.backgroundElement },
        headerTintColor: Colors.light.text,
      }} />
      <View style={styles.container}>
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.address_id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <View style={styles.iconBox}>
                  <Ionicons name="location" size={20} color={Colors.light.primary} />
                </View>
                <Text style={styles.cityText}>{item.province}</Text>
                {item.is_default && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Mặc định</Text>
                  </View>
                )}
              </View>
              <View style={styles.addressBody}>
                <Text style={[styles.addressDetail, { fontWeight: '700', color: Colors.light.text, marginBottom: 2 }]}>
                  {item.receiver_name} - {item.receiver_phone}
                </Text>
                <Text style={styles.addressDetail}>{item.specific_address}</Text>
                <Text style={styles.addressDetail}>{item.ward}, {item.district}</Text>
              </View>
              <View style={styles.addressFooter}>
                <TouchableOpacity onPress={() => handleDelete(item.address_id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color={Colors.light.danger} />
                  <Text style={styles.deleteText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="map-outline" size={64} color={Colors.light.border} />
              <Text style={styles.emptyText}>Bạn chưa có địa chỉ nào</Text>
            </View>
          }
        />

        <TouchableOpacity 
          activeOpacity={0.8}
          style={styles.addBtnWrapper}
          onPress={() => setShowModal(true)}
        >
          <LinearGradient
            colors={Gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addBtn}
          >
            <Ionicons name="add" size={24} color={Colors.light.white} style={{ marginRight: 8 }} />
            <Text style={styles.addBtnText}>Thêm địa chỉ mới</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm địa chỉ</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <TextInput style={styles.input} placeholder="Tên người nhận" value={receiverName} onChangeText={setReceiverName} />
              <TextInput style={styles.input} placeholder="Số điện thoại" value={receiverPhone} onChangeText={setReceiverPhone} keyboardType="phone-pad" />
              <TextInput style={styles.input} placeholder="Số nhà, Tên đường" value={specificAddress} onChangeText={setSpecificAddress} />
              <TextInput style={styles.input} placeholder="Phường / Xã" value={ward} onChangeText={setWard} />
              <TextInput style={styles.input} placeholder="Quận / Huyện" value={district} onChangeText={setDistrict} />
              <TextInput style={styles.input} placeholder="Tỉnh / Thành phố" value={province} onChangeText={setProvince} />
              
              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleAddAddress}
                disabled={isSubmitting}
              >
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Lưu địa chỉ</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: Spacing.lg, paddingBottom: 100 },
  addressCard: { backgroundColor: Colors.light.white, padding: Spacing.md, borderRadius: Radius.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.light.border, ...Shadows.light },
  addressHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  iconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.light.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: Spacing.sm },
  cityText: { fontSize: 16, fontWeight: '700', color: Colors.light.text, flex: 1 },
  defaultBadge: { backgroundColor: Colors.light.success + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm },
  defaultText: { fontSize: 10, fontWeight: 'bold', color: Colors.light.success },
  addressBody: { marginLeft: 40, marginBottom: Spacing.md },
  addressDetail: { fontSize: 14, color: Colors.light.textSecondary, marginBottom: 4 },
  addressFooter: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: Colors.light.border, paddingTop: Spacing.sm },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', padding: 4 },
  deleteText: { fontSize: 14, color: Colors.light.danger, marginLeft: 4, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { fontSize: 16, color: Colors.light.textSecondary, marginTop: Spacing.md },
  addBtnWrapper: { position: 'absolute', bottom: Spacing.xl, left: Spacing.lg, right: Spacing.lg, borderRadius: Radius.pill, overflow: 'hidden', ...Shadows.medium },
  addBtn: { height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: Colors.light.white, fontSize: 16, fontWeight: '800' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.light.background, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.light.text },
  modalBody: { padding: Spacing.lg },
  input: { backgroundColor: Colors.light.white, borderWidth: 1, borderColor: Colors.light.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, height: 50, marginBottom: Spacing.md, fontSize: 15 },
  submitBtn: { backgroundColor: Colors.light.primary, height: 50, borderRadius: Radius.pill, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.sm, marginBottom: 40 },
  submitBtnText: { color: Colors.light.white, fontSize: 16, fontWeight: 'bold' }
});
