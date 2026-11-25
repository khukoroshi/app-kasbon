import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

interface QuickChipsProps {
  onSelectTag: (tag: string) => void;
}

export const QuickChips: React.FC<QuickChipsProps> = ({ onSelectTag }) => {
  const commonItems = [
    'Beras',
    'Minyak',
    'Telur',
    'Gula',
    'Kopi',
    'Rokok',
    'Gas 3kg',
    'Galon',
    'Mie Instan',
    'Sabun',
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Pilihan Cepat Barang:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {commonItems.map((item) => (
          <TouchableOpacity
            key={item}
            style={styles.chip}
            onPress={() => onSelectTag(item)}
            activeOpacity={0.6}
          >
            <Text style={styles.chipText}>+ {item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  scroll: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    backgroundColor: '#f8fafc',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  chipText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
});
