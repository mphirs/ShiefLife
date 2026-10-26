
import { Alert, Linking } from 'react-native';

const TEST_WHATSAPP_NUMBER = '265994581381';
const TEST_EMAIL = 'msambakusi@gmail.com';

export async function openWhatsAppReminder(
  productName: string,
  expiryDate: string,
  daysRemaining: number,
) {
  const message =
    `ShelfLife Expiry Reminder\n\n` +
    `Product: ${productName}\n` +
    `Expiry date: ${expiryDate}\n` +
    `Days remaining: ${daysRemaining}\n\n` +
    `Please check this product before it expires.`;

  const url =
    `https://wa.me/${TEST_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      'WhatsApp unavailable',
      'Install WhatsApp or open this link in your browser.',
    );
  }
}

export async function openEmailReminder(
  productName: string,
  expiryDate: string,
  daysRemaining: number,
) {
  const subject = `ShelfLife expiry reminder: ${productName}`;
  const body =
    `Hello,\n\n` +
    `${productName} expires on ${expiryDate}.\n` +
    `Days remaining: ${daysRemaining}.\n\n` +
    `Please check this product before it expires.\n\n` +
    `ShelfLife`;

  const url =
    `mailto:${TEST_EMAIL}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;

  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      'Email unavailable',
      'No compatible email application was found on this phone.',
    );
  }
}
