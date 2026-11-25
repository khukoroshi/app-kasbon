import { Linking } from 'react-native';

export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const createKasbonNoticeMessage = (
  storeName: string,
  customerName: string,
  newAmount: number,
  notes: string | undefined,
  totalBalance: number
): string => {
  return (
    `*Pemberitahuan Kasbon - ${storeName}*\n\n` +
    `Halo Bpk/Ibu *${customerName}*,\n` +
    `Catatan kasbon baru berhasil ditambahkan:\n` +
    `📅 Tanggal: ${new Date().toLocaleDateString('id-ID')}\n` +
    `💵 Nominal: *${formatRupiah(newAmount)}*\n` +
    (notes ? `📝 Keterangan: ${notes}\n` : '') +
    `--------------------------------\n` +
    `📊 *Total Saldo Kasbon Saat Ini: ${formatRupiah(totalBalance)}*\n\n` +
    `Terima kasih telah berbelanja di warung kami! 🙏`
  );
};

export const createPaymentReceiptMessage = (
  storeName: string,
  customerName: string,
  paymentAmount: number,
  remainingBalance: number
): string => {
  return (
    `*Bukti Pembayaran Kasbon - ${storeName}*\n\n` +
    `Halo Bpk/Ibu *${customerName}*,\n` +
    `Pembayaran kasbon telah kami terima:\n` +
    `📅 Tanggal: ${new Date().toLocaleDateString('id-ID')}\n` +
    `💵 Jumlah Bayar: *${formatRupiah(paymentAmount)}*\n` +
    `--------------------------------\n` +
    `📊 *Sisa Kasbon Anda: ${formatRupiah(remainingBalance)}*` +
    (remainingBalance === 0 ? ` *(LUNAS 🎉)*` : '') +
    `\n\nTerima kasih banyak atas kerjasamanya! 🙏`
  );
};

export const sendWhatsAppMessage = async (phoneNumber: string, message: string): Promise<boolean> => {
  // Bersihkan format nomor HP (ganti 08xx jadi 628xx)
  let cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.substring(1);
  }

  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${cleanPhone}?text=${encoded}`;

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    } else {
      console.warn('WhatsApp tidak dapat dibuka di perangkat ini.');
      return false;
    }
  } catch (err) {
    console.error('Gagal membuka WhatsApp:', err);
    return false;
  }
};
