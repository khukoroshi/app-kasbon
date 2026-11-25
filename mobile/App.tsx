import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
  View,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Customer, SummaryStats } from './src/types';
import { localDb } from './src/database/sqlite';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { QuickDebtScreen } from './src/screens/QuickDebtScreen';
import { PaymentScreen } from './src/screens/PaymentScreen';

export default function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<SummaryStats>({
    totalCustomers: 0,
    totalOutstandingDebt: 0,
    customersWithDebtCount: 0,
  });

  // Screen router: 'DASHBOARD' | 'QUICK_DEBT' | 'PAYMENT'
  const [activeScreen, setActiveScreen] = useState<'DASHBOARD' | 'QUICK_DEBT' | 'PAYMENT'>('DASHBOARD');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  const [selectedPaymentCustomer, setSelectedPaymentCustomer] = useState<Customer | null>(null);

  // Modal Tambah Pelanggan Baru
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustAddress, setNewCustAddress] = useState<string>('');

  const loadData = async () => {
    try {
      await localDb.init();
      const custList = await localDb.getCustomers();
      const summary = await localDb.getSummaryStats();
      setCustomers(custList);
      setStats(summary);
    } catch (err) {
      console.error('Failed to load local database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCustomer = async () => {
    if (!newCustName.trim()) {
      Alert.alert('Perhatian', 'Nama pelanggan wajib diisi.');
      return;
    }
    await localDb.addCustomer(newCustName.trim(), newCustPhone.trim(), newCustAddress.trim());
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setShowAddCustomerModal(false);
    await loadData();
    Alert.alert('Sukses', 'Pelanggan baru berhasil ditambahkan!');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Memuat Buku Kasbon Warung...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f1f5f9" />

      {activeScreen === 'DASHBOARD' && (
        <DashboardScreen
          customers={customers}
          stats={stats}
          onOpenQuickDebt={(customerId) => {
            setSelectedCustomerId(customerId);
            setActiveScreen('QUICK_DEBT');
          }}
          onOpenPayment={(cust) => {
            setSelectedPaymentCustomer(cust);
            setActiveScreen('PAYMENT');
          }}
          onAddCustomer={() => setShowAddCustomerModal(true)}
          onRefreshData={loadData}
        />
      )}

      {activeScreen === 'QUICK_DEBT' && (
        <QuickDebtScreen
          customers={customers}
          initialCustomerId={selectedCustomerId}
          onSuccess={async () => {
            await loadData();
            setActiveScreen('DASHBOARD');
          }}
          onCancel={() => setActiveScreen('DASHBOARD')}
        />
      )}

      {activeScreen === 'PAYMENT' && selectedPaymentCustomer && (
        <PaymentScreen
          customer={selectedPaymentCustomer}
          onSuccess={async () => {
            await loadData();
            setActiveScreen('DASHBOARD');
          }}
          onCancel={() => setActiveScreen('DASHBOARD')}
        />
      )}

      {/* Modal Tambah Pelanggan Baru */}
      <Modal visible={showAddCustomerModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Tambah Pelanggan Baru</Text>

            <Text style={styles.inputLabel}>Nama Pelanggan / Panggilan:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Contoh: Pak Budi Pos Ronda, Bu RT Endang"
              placeholderTextColor="#94a3b8"
              value={newCustName}
              onChangeText={setNewCustName}
            />

            <Text style={styles.inputLabel}>No. WhatsApp (Opsional untuk kirim nota):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Contoh: 08123456789"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={newCustPhone}
              onChangeText={setNewCustPhone}
            />

            <Text style={styles.inputLabel}>Alamat / Patokan Rumah (Opsional):</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Contoh: Rumah cat hijau samping masjid"
              placeholderTextColor="#94a3b8"
              value={newCustAddress}
              onChangeText={setNewCustAddress}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAddCustomerModal(false)}
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleCreateCustomer}>
                <Text style={styles.modalSaveText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalCancelText: {
    color: '#64748b',
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalSaveText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
