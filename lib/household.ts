// Household sharing: everyone who enters the same code sees the same shelf, shopping list and
// history. Uses Firebase Firestore (free tier is plenty). Setup steps are in README.md.
//   npm i firebase
// and add the EXPO_PUBLIC_FIREBASE_* values to your .env file.
import { initializeApp, getApps } from 'firebase/app';
import { doc, getFirestore, initializeFirestore, onSnapshot, setDoc } from 'firebase/firestore';
import { eventsStore } from './events';
import { productsStore } from './products';
import { shoppingStore } from './shopping';
import type { Collection, Row } from './store';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const householdAvailable = () => !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

export function generateHouseholdCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

let stops: Array<() => void> = [];

export function stopHousehold() {
  stops.forEach(s => s());
  stops = [];
}

export async function startHousehold(code: string) {
  stopHousehold();
  if (!householdAvailable() || !code) return;

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig as any);
  let db;
  try {
    db = initializeFirestore(app, { experimentalForceLongPolling: true });
  } catch {
    db = getFirestore(app); // already initialised (fast refresh)
  }
  const ref = doc(db, 'households', code.toUpperCase());

  const stores: Record<string, Collection<any>> = {
    products: productsStore,
    shopping: shoppingStore,
    events: eventsStore,
  };

  // Local changes -> cloud
  for (const [name, store] of Object.entries(stores)) {
    stops.push(
      store.onLocalWrite((rows: Row[]) => {
        setDoc(ref, { [name]: JSON.stringify(rows) }, { merge: true }).catch(e =>
          console.warn('household push failed', e),
        );
      }),
    );
  }

  // Cloud -> local (and push our existing data once after the first snapshot)
  let firstSnapshot = true;
  stops.push(
    onSnapshot(
      ref,
      async snap => {
        const data = snap.data() ?? {};
        for (const [name, store] of Object.entries(stores)) {
          if (typeof data[name] === 'string') {
            try {
              await store.mergeRemote(JSON.parse(data[name]));
            } catch {}
          }
        }
        if (firstSnapshot) {
          firstSnapshot = false;
          const payload: Record<string, string> = {};
          for (const [name, store] of Object.entries(stores)) payload[name] = JSON.stringify(await store.raw());
          await setDoc(ref, payload, { merge: true });
        }
      },
      e => console.warn('household listen failed', e),
    ),
  );
}
