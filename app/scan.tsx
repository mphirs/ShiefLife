// NEW app/scan.tsx  -> barcode scanner. On success it opens "Add product" with the details filled in.
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { lookupBarcode } from '../lib/barcode';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Point the camera at the barcode');
  const locked = useRef(false);

  async function onScanned({ data }: { data: string }) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setMessage('Looking up product…');
    const info = await lookupBarcode(data);
    if (info) {
      router.replace({
        pathname: '/add-product',
        params: { name: info.name, category: info.category, days: String(info.days), barcode: data },
      });
    } else {
      setMessage('Not in the database yet. Type the name once and we will remember it.');
      setTimeout(() => router.replace({ pathname: '/add-product', params: { barcode: data, name: '' } }), 1400);
    }
  }

  if (!permission) return <View style={styles.center} />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.big}>📷</Text>
        <Text style={styles.title}>Camera access needed</Text>
        <Text style={styles.text}>ShelfLife uses the camera only to read barcodes.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}><Text style={styles.btnText}>Allow camera</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.link}>Not now</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.full}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'qr'] }}
        onBarcodeScanned={busy ? undefined : onScanned}
      />
      <View style={styles.frameWrap} pointerEvents="none">
        <View style={styles.frame} />
      </View>
      <View style={styles.top}>
        <TouchableOpacity style={styles.pill} onPress={() => router.back()}><Text style={styles.pillText}>✕ Close</Text></TouchableOpacity>
        <TouchableOpacity style={styles.pill} onPress={() => setTorch(v => !v)}><Text style={styles.pillText}>{torch ? '🔦 On' : '🔦 Off'}</Text></TouchableOpacity>
      </View>
      <View style={styles.bottom}>
        {busy ? <ActivityIndicator color="#fff" style={{ marginBottom: 8 }} /> : null}
        <Text style={styles.msg}>{message}</Text>
        <TouchableOpacity style={styles.manual} onPress={() => router.replace('/add-product')}>
          <Text style={styles.manualText}>Type it instead</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: '#0F1A13' },
  big: { fontSize: 56 },
  title: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 12 },
  text: { color: '#B5C4B8', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  btn: { backgroundColor: '#237A4B', paddingHorizontal: 28, paddingVertical: 15, borderRadius: 16, marginTop: 22 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  link: { color: '#B5C4B8', marginTop: 18, fontWeight: '700' },
  frameWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  frame: { width: 270, height: 170, borderRadius: 20, borderWidth: 3, borderColor: '#7CE0A3' },
  top: { position: 'absolute', top: 54, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  pill: { backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 20 },
  pillText: { color: '#fff', fontWeight: '800' },
  bottom: { position: 'absolute', bottom: 40, left: 20, right: 20, alignItems: 'center' },
  msg: { color: '#fff', fontWeight: '700', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, overflow: 'hidden' },
  manual: { marginTop: 14, backgroundColor: '#fff', paddingHorizontal: 22, paddingVertical: 14, borderRadius: 16 },
  manualText: { color: '#1D5E3C', fontWeight: '900' },
});
