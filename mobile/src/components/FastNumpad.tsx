import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface FastNumpadProps {
  onDigitPress: (digit: string) => void;
  onQuickAdd: (amount: number) => void;
  onDelete: () => void;
  onClear: () => void;
}

export const FastNumpad: React.FC<FastNumpadProps> = ({
  onDigitPress,
  onQuickAdd,
  onDelete,
  onClear,
}) => {
  const quickAmounts = [5000, 10000, 20000, 50000, 100000];

  return (
    <View style={styles.container}>
      {/* Tombol Pintasan Tambah Cepat */}
      <View style={styles.quickRow}>
        {quickAmounts.map((amt) => (
          <TouchableOpacity
            key={amt}
            style={styles.quickBtn}
            onPress={() => onQuickAdd(amt)}
            activeOpacity={0.7}
          >
            <Text style={styles.quickText}>+{amt / 1000}rb</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Grid Keypad Angka */}
      <View style={styles.grid}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <TouchableOpacity
            key={digit}
            style={styles.keyBtn}
            onPress={() => onDigitPress(digit)}
            activeOpacity={0.7}
          >
            <Text style={styles.keyText}>{digit}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={[styles.keyBtn, styles.actionBtn]} onPress={onClear}>
          <Text style={styles.actionText}>C</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.keyBtn} onPress={() => onDigitPress('0')}>
          <Text style={styles.keyText}>0</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.keyBtn, styles.actionBtn]} onPress={onDelete}>
          <Text style={styles.actionText}>⌫</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickBtn: {
    backgroundColor: '#e0f2fe',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7dd3fc',
  },
  quickText: {
    color: '#0369a1',
    fontWeight: '700',
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  keyBtn: {
    width: '31%',
    backgroundColor: '#ffffff',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
  },
  keyText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0f172a',
  },
  actionBtn: {
    backgroundColor: '#f1f5f9',
  },
  actionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ef4444',
  },
});
