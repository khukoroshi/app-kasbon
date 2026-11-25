import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { Customer, SummaryStats } from '../types';
import { formatRupiah, createKasbonNoticeMessage, sendWhatsAppMessage } from '../services/whatsapp';
import { syncEngine } from '../services/syncEngine';

interface DashboardScreenProps {
  customers: Customer[];
  stats: SummaryStats;
  onOpenQuickDebt: (customerId?: string) => void;
  onOpenPayment: (customer: Customer) => void;
  onAddCustomer: () => void;
  onRefreshData: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  customers,
  stats,
  onOpenQuickDebt,
  onOpenPayment,
  onAddCustomer,
  onRefreshData,
}) => {
  const [search, setSearch] = useState<string>('');
  const [syncing, setSyncing] = useState<boolean>(false);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );

  const pendingCount = customers.filter((c) => c.sync_status === 'PENDING').length;

  const handleSyncNow = async () => {
    setSyncing(true);
    const result = await syncEngine.runSync();
    setSyncing(false);
    onRefreshData();
    Alert.alert(result.success ? 'Sinkronisasi' : 'Info Jaringan', result.message);
  };

  const handleSendReminderWA = async (customer: Customer) => {
    if (!customer.phone) {
      Alert.alert('Info', 'Pelanggan ini belum memiliki nomor WhatsApp.');
      return;
    }
    const msg =
      `Halo Bpk/Ibu *${customer.name}*,\n` +
      `Mengingatkan catatan kasbon di Warung Berkah saat ini adalah *${formatRupiah(customer.current_balance)}*.\n` +
      `Jika ada kelonggaran, bisa dicicil atau dilunasi ya. Terima kasih banyak! 🙏`;
    await sendWhatsAppMessage(customer.phone, msg);
  };

  return (
    <View style={styles.container}>
      {/* Header & Status Sinkronisasi */}
      <View style={styles.header}>
        <View>
          <Text style={styles.storeTitle}>🏪 Warung Berkah</Text>
          <Text style={styles.storeSubtitle}>Buku Kasbon Digital (Offline-First)</Text>
        </View>

        <TouchableOpacity
          style={[styles.syncBadge, pendingCount > 0 ? styles.syncPending : styles.syncOk]}
          onPress={handleSyncNow}
          disabled={syncing}
        >
          <Text style={styles.syncText}>
            {syncing ? '⏳ Syncing...' : pendingCount > 0 ? `🟡 ${pendingCount} Tertunda` : '🟢 Cloud Sync'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Banner Total Piutang Toko */}
      <View style={styles.statsCard}>
        <Text style={styles.statsLabel}>Total Uang Kasbon di Luar (Piutang):</Text>
        <Text style={styles.statsValue}>{formatRupiah(stats.totalOutstandingDebt)}</Text>
        <Text style={styles.statsDesc}>
          Dari {stats.customersWithDebtCount} pelanggan yang belum lunas (Total {stats.totalCustomers} pelanggan)
        </Text>
      </View>

      {/* Tombol Aksi Utama */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.primaryActionBtn}
          onPress={() => onOpenQuickDebt()}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryActionText}>⚡ + CATAT KASBON BARU</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryActionBtn}
          onPress={onAddCustomer}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryActionText}>+ Pelanggan</Text>
        </TouchableOpacity>
      </View>

      {/* Pencarian Pelanggan */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Cari nama pelanggan atau no. HP..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Daftar Kasbon Pelanggan */}
      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Tidak ada data pelanggan yang cocok.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.customerCard}>
            <View style={styles.custHeaderRow}>
              <View>
                <Text style={styles.cardCustName}>{item.name}</Text>
                {item.phone && <Text style={styles.cardCustPhone}>📞 {item.phone}</Text>}
              </View>

              <View style={styles.balanceBadge}>
                <Text style={styles.balanceLabel}>Sisa Hutang:</Text>
                <Text
                  style={[
                    styles.balanceValue,
                    item.current_balance > 0 ? styles.balanceDanger : styles.balanceZero,
                  ]}
                >
                  {formatRupiah(item.current_balance)}
                </Text>
              </View>
            </View>

            {/* Tombol Aksi per Pelanggan */}
            <View style={styles.custActionRow}>
              <TouchableOpacity
                style={styles.custDebtBtn}
                onPress={() => onOpenQuickDebt(item.id)}
              >
                <Text style={styles.custDebtBtnText}>+ Kasbon</Text>
              </TouchableOpacity>

              {item.current_balance > 0 && (
                <>
                  <TouchableOpacity
                    style={styles.custPayBtn}
                    onPress={() => onOpenPayment(item)}
                  >
                    <Text style={styles.custPayBtnText}>💵 Bayar</Text>
                  </TouchableOpacity>

                  {item.phone && (
                    <TouchableOpacity
                      style={styles.custWaBtn}
                      onPress={() => handleSendReminderWA(item)}
                    >
                      <Text style={styles.custWaBtnText}>📱 Tagih WA</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingTop: 8,
  },
  storeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  storeSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  syncBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  syncOk: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  syncPending: {
    backgroundColor: '#fef9c3',
    borderColor: '#fde047',
  },
  syncText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  statsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
  },
  statsLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  statsValue: {
    fontSize: 30,
    fontWeight: '900',
    color: '#38bdf8',
    marginVertical: 4,
  },
  statsDesc: {
    fontSize: 11,
    color: '#cbd5e1',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  primaryActionBtn: {
    flex: 2,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  searchBox: {
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0f172a',
  },
  listContent: {
    paddingBottom: 20,
  },
  customerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
  },
  custHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardCustName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  cardCustPhone: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  balanceBadge: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  balanceDanger: {
    color: '#dc2626',
  },
  balanceZero: {
    color: '#16a34a',
  },
  custActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  custDebtBtn: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  custDebtBtnText: {
    color: '#15803d',
    fontWeight: '700',
    fontSize: 12,
  },
  custPayBtn: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#7dd3fc',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  custPayBtnText: {
    color: '#0369a1',
    fontWeight: '700',
    fontSize: 12,
  },
  custWaBtn: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  custWaBtnText: {
    color: '#047857',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
});
