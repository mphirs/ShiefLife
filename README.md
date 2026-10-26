# ShelfLife upgrade pack

Copy these folders into the ROOT of your Expo project (same level as `app/`, `lib/`, `package.json`).
Your project already has `app/`, `app/(tabs)/` and `lib/`, so files marked REPLACE overwrite yours.

## 1. Folder map

| Path | Status | What it does |
|---|---|---|
| `app/_layout.tsx` | REPLACE (your `_layout_1.tsx`) | Onboarding gate, notification setup + Snooze handler, household sync, new screens |
| `app/(tabs)/_layout.tsx` | REPLACE (your `_layout.tsx`) | 5 tabs with a big centre "+" button (one-hand), dark mode |
| `app/(tabs)/index.tsx` | REPLACE | "Use today" / "This week" home, rings, swipe, quick actions, streak, celebration |
| `app/(tabs)/add-product.tsx` | REPLACE | Scan buttons, name autocomplete, smart default date, stepper, sticky Save |
| `app/(tabs)/recipes.tsx` | NEW | Recipe ideas from expiring food |
| `app/(tabs)/shopping.tsx` | NEW | Shopping list |
| `app/(tabs)/insights.tsx` | NEW | Money saved, waste score, streak, share, business report |
| `app/scan.tsx` | NEW | Barcode scanner |
| `app/receipt.tsx` | NEW | Receipt photo -> review -> add all |
| `app/settings.tsx` | NEW | Currency, reminders, household, business mode |
| `app/onboarding.tsx` | NEW | 3-screen onboarding |
| `components/*` | NEW | ExpiryRing, SwipeRow, ProductRow, ActionSheet, Celebration, EmptyState |
| `lib/products.ts` | REPLACE | Same storage key (old data still loads). `expiryLabel/expiryColor` now take DAYS |
| `lib/notifications.ts` | REPLACE | Morning summary + Snooze (replaces one-ping-per-product) |
| `lib/contact.ts` | UNCHANGED | Not touched |
| `lib/*.ts` (all others) | NEW | store, dates, theme, settings, categories, shelfLife, barcode, receipt, recipes, actions, events, stats, shopping, household, businessReport |

Note: your old `index.tsx` called `expiryColor(days)` / `expiryLabel(days)` but the old helpers expected a date string, so colours/labels were wrong. That is fixed.

## 2. Install

```bash
npx expo install expo-camera expo-image-picker expo-print expo-sharing react-native-svg \
  expo-notifications @react-native-async-storage/async-storage react-native-safe-area-context
npm install firebase        # needed because lib/household.ts imports it (see section 4)
npx expo start -c
```

`app.json` -> add plugins (needed for real builds; Expo Go works without):
```json
"plugins": [
  "expo-router",
  ["expo-camera", { "cameraPermission": "ShelfLife uses the camera to scan barcodes." }],
  ["expo-image-picker", { "cameraPermission": "ShelfLife uses the camera to scan receipts." }],
  "expo-notifications"
]
```

`.env` (create in project root):
```
EXPO_PUBLIC_OCR_SPACE_KEY=your_ocr_space_key      # free key from ocr.space (receipt scan)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

## 3. Feature status (be honest in your demo / report)

| # | Feature | Status |
|---|---|---|
| 1 | Barcode scan | Works in Expo Go. Uses Open Food Facts; unknown local products are learned after you save them once |
| 2 | Receipt scan | Works via OCR.space API. Always shows a review screen, because OCR on thermal receipts is imperfect |
| 3 | Smart default dates | Works offline (edit `lib/shelfLife.ts` to add local foods) |
| 4 | Recipe suggestions | Works offline (edit `lib/recipes.ts` to add recipes) |
| 5 | Money saved, waste score, streak, share | Works. Uses price entered, else "average item value" in Settings |
| 6 | Swipe / quick actions | Works. Right = Used, Left = Delete, tap = Used / Frozen / Thrown out / Delete |
| 7 | Household sharing | Code written; needs a Firebase project (section 4) |
| 8 | Shopping list | Works, with "Add to list" after Used |
| 9 | Smart reminders | Morning summary + Snooze. Snooze while the app is closed is only reliable in a development build, not Expo Go |
| 10 | Home screen widget | NOT possible in Expo Go. See section 5 |
| 11 | Business mode | Batch no., supplier, unit cost, printable/shareable PDF report |

## 4. Household sharing setup (Firebase, free)
1. console.firebase.google.com -> create project -> add a **Web app** -> copy the config values into `.env`.
2. Build -> **Firestore Database** -> create (start in test mode for development).
3. Before real users: replace test rules with rules that limit access (e.g. require auth) and add Firebase Anonymous Auth.
4. In the app: Insights -> ⚙️ -> Create a household, then share the 6-letter code.
Sync is "newest change wins" per item, which is fine for a family shelf.

## 5. Home screen widget (needs a development build)
Widgets run outside the JS app, so Expo Go cannot show them. After the rest works:
`npx expo prebuild`, then use a widget library such as `react-native-android-widget` (Android) or Expo's `expo-widgets`/SwiftUI targets (iOS), and feed it the same data: items where
`daysUntilExpiry(p.expiryDate) <= 1` from `productsStore.list()`.

## 6. Making money (Business mode)
`settings.businessMode` is a plain switch today. To charge for it, put it behind a subscription (RevenueCat is the usual choice) and gate the switch and the report buttons.
