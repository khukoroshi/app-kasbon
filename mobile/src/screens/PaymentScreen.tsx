import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Customer } from '../types';
import { localDb } from '../database/sqlite';
import { FastNumpad } from '../components/FastNumpad';
import { formatRupiah, createPaymentReceiptMessage, sendWhatsAppMessage } from '../services/whatsapp';

interface PaymentScreenProps {
  customer: Customer;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ customer, onSuccess, onCancel }) => {
  const [amountStr, setAmountStr] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'QRIS'>('CASH');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  const handlePayFull = () => {
    setAmountStr(customer.current_balance.toString());
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

  const handleSavePayment = async () => {
    if (currentAmount <= 0) {
      Alert.alert('Perhatian', 'Nominal pembayaran harus lebih dari Rp 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      await localDb.recordTransaction(
        customer.id,
        'PAYMENT',
        currentAmount,
        `Pembayaran via ${paymentMethod}`,
        paymentMethod
      );

      const remaining = Math.max(0, customer.current_balance - currentAmount);
      setIsSubmitting(false);

      if (customer.phone) {
        Alert.alert(
          'Pembayaran Diterima!',
          `Sisa hutang ${customer.name}: ${formatRupiah(remaining)}. Kirim bukti tanda terima ke WhatsApp pelanggan?`,
          [
            { text: 'Selesai', onPress: onSuccess },
            {
              text: 'Kirim WA 📱',
              onPress: async () => {
                const msg = createPaymentReceiptMessage(
                  'Warung Berkah',
                  customer.name,
                  currentAmount,
                  remaining
                );
                await sendWhatsAppMessage(customer.phone!, msg);
                onSuccess();
              },
            },
          ]
        );
      } else {
        Alert.alert('Berhasil', 'Pembayaran kasbon berhasil dicatat!', [
          { text: 'OK', onPress: onSuccess },
        ]);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert('Error', err.message || 'Gagal memproses pembayaran.');
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Terima Bayar Kasbon</Text>
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Batal</Text>
        </TouchableOpacity>
      </View>

      {/* Info Pelanggan */}
      <View style={styles.infoCard}>
        <Text style={styles.custName}>{customer.name}</Text>
        <Text style={styles.debtLabel}>Total Hutang Tertunggak:</Text>
        <Text style={styles.debtValue}>{formatRupiah(customer.current_balance)}</Text>

        <TouchableOpacity style={styles.fullPayBtn} onPress={handlePayFull}>
          <Text style={styles.fullPayText}>⚡ Bayar Lunas ({formatRupiah(customer.current_balance)})</Text>
        </TouchableOpacity>
      </View>

      {/* Pilihan Metode Bayar */}
      <View style={styles.methodRow}>
        {(['CASH', 'TRANSFER', 'QRIS'] as const).map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.methodBtn, paymentMethod === m && styles.methodBtnActive]}
            onPress={() => setPaymentMethod(m)}
          >
            <Text style={[styles.methodText, paymentMethod === m && styles.methodTextActive]}>
              {m === 'CASH' ? '💵 Tunai' : m === 'TRANSFER' ? '🏦 Transfer' : '📱 QRIS'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Input Nominal Bayar */}
      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>Nominal Pembayaran Diterima:</Text>
        <Text style={styles.amountValue}>{formatRupiah(currentAmount)}</Text>
      </View>

      {/* Numpad */}
      <FastNumpad
        onDigitPress={handleDigitPress}
        onQuickAdd={handleQuickAdd}
        onDelete={handleDelete}
        onClear={handleClear}
      />

      <TouchableOpacity
        style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
        onPress={handleSavePayment}
        disabled={isSubmitting}
        activeOpacity={0.8}
      >
        <Text style={styles.saveBtnText}>
          {isSubmitting ? 'Memproses...' : '✅ TERIMA PEMBAYARAN'}
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
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  custName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  debtLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
  },
  debtValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#dc2626',
    marginTop: 2,
  },
  fullPayBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  fullPayText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 13,
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  methodBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    marginHorizontal: 3,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  methodBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0369a1',
  },
  methodText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  methodTextActive: {
    color: '#ffffff',
  },
  amountCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  amountLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  amountValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0284c7',
  },
  saveBtn: {
    backgroundColor: '#0284c7',
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
