import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Customer } from '../types';
import { localDb } from '../database/sqlite';
import { FastNumpad } from '../components/FastNumpad';
import { QuickChips } from '../components/QuickChips';
import { formatRupiah, createKasbonNoticeMessage, sendWhatsAppMessage } from '../services/whatsapp';

interface QuickDebtScreenProps {
  customers: Customer[];
  initialCustomerId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const QuickDebtScreen: React.FC<QuickDebtScreenProps> = ({
  customers,
  initialCustomerId,
  onSuccess,
  onCancel,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustomerId || (customers[0]?.id ?? '')
  );
  const [amountStr, setAmountStr] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const currentAmount = parseInt(amountStr, 10) || 0;

  const handleDigitPress = (digit: string) => {
    if (amountStr === '0') {
      setAmountStr(digit);
    } else if (amountStr.length < 9) {
      setAmountStr(amountStr + digit);
    }
  };

  const handleQuickAdd = (amt: number) => {
    const next = currentAmount + amt;
    setAmountStr(next.toString());
  };

  const handleDelete = () => {
    if (amountStr.length <= 1) {
      setAmountStr('0');
    } else {
      setAmountStr(amountStr.slice(0, -1));
    }
  };

  const handleClear = () => {
    setAmountStr('0');
  };

  const handleSelectTag = (tag: string) => {
    if (!notes.trim()) {
      setNotes(tag);
    } else {
      setNotes(`${notes}, ${tag}`);
    }
  };

  const handleSaveDebt = async () => {
    if (!selectedCustomerId) {
      Alert.alert('Perhatian', 'Silakan pilih pelanggan terlebih dahulu.');
      return;
    }
    if (currentAmount <= 0) {
      Alert.alert('Perhatian', 'Nominal kasbon harus lebih dari Rp 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      await localDb.recordTransaction(
        selectedCustomerId,
        'DEBT',
        currentAmount,
        notes.trim() || undefined
      );

      const updatedCust = (await localDb.getCustomers()).find((c) => c.id === selectedCustomerId);
      const totalBalance = updatedCust ? updatedCust.current_balance : currentAmount;

      setIsSubmitting(false);

      // Tawarkan kirim nota WA jika pelanggan memiliki nomor HP
      if (selectedCustomer?.phone) {
        Alert.alert(
          'Kasbon Berhasil Disimpan!',
          `Total kasbon ${selectedCustomer.name} sekarang: ${formatRupiah(totalBalance)}. Kirim nota ke WhatsApp pelanggan?`,
          [
            { text: 'Selesai', onPress: onSuccess },
            {
              text: 'Kirim WA 📱',
              onPress: async () => {
                const msg = createKasbonNoticeMessage(
                  'Warung Berkah',
                  selectedCustomer.name,
                  currentAmount,
                  notes.trim(),
                  totalBalance
                );
                await sendWhatsAppMessage(selectedCustomer.phone!, msg);
                onSuccess();
              },
            },
          ]
        );
      } else {
        Alert.alert('Berhasil', 'Kasbon berhasil dicatat di buku!', [
          { text: 'OK', onPress: onSuccess },
        ]);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert('Error', err.message || 'Gagal menyimpan transaksi kasbon.');
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Catat Kasbon Baru</Text>
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Batal</Text>
        </TouchableOpacity>
      </View>

      {/* Pilihan Pelanggan */}
      <View style={styles.section}>
        <Text style={styles.label}>Pilih Pelanggan:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.custScroll}>
          {customers.map((c) => {
            const isSelected = c.id === selectedCustomerId;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.custChip, isSelected && styles.custChipActive]}
                onPress={() => setSelectedCustomerId(c.id)}
              >
                <Text style={[styles.custName, isSelected && styles.custNameActive]}>{c.name}</Text>
                <Text style={[styles.custDebt, isSelected && styles.custDebtActive]}>
                  {formatRupiah(c.current_balance)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tampilan Nominal Kasbon */}
      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>Nominal Kasbon:</Text>
        <Text style={styles.amountValue}>{formatRupiah(currentAmount)}</Text>
      </View>

      {/* Catatan Bebas & Quick Chips */}
      <View style={styles.section}>
        <Text style={styles.label}>Catatan Barang (Opsional):</Text>
        <TextInput
          style={styles.inputNotes}
          placeholder="Contoh: Beras 5kg, Telur 1/2kg..."
          placeholderTextColor="#94a3b8"
          value={notes}
          onChangeText={setNotes}
        />
        <QuickChips onSelectTag={handleSelectTag} />
      </View>

      {/* Numpad Cepat */}
      <FastNumpad
        onDigitPress={handleDigitPress}
        onQuickAdd={handleQuickAdd}
        onDelete={handleDelete}
        onClear={handleClear}
      />

      {/* Tombol Simpan */}
      <TouchableOpacity
        style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
        onPress={handleSaveDebt}
        disabled={isSubmitting}
        activeOpacity={0.8}
      >
        <Text style={styles.saveBtnText}>
          {isSubmitting ? 'Menyimpan...' : '💾 SIMPAN KASBON'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  cancelBtn: {
    padding: 6,
  },
  cancelText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  section: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  custScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  custChip: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  custChipActive: {
    backgroundColor: '#16a34a',
    borderColor: '#15803d',
  },
  custName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  custNameActive: {
    color: '#ffffff',
  },
  custDebt: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  custDebtActive: {
    color: '#dcfce7',
  },
  amountCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  amountLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#16a34a',
  },
  inputNotes: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  saveBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    elevation: 2,
  },
  saveBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
