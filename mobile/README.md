# Gram Panchayat Ghirni - Mobile App (Android / iOS)

A React Native (Expo) citizen app that talks to the same backend API as the
website. Taxpayers can log in, view their dues, pay tax online via Razorpay,
and see their receipts. A digital receipt PDF is emailed automatically after
every successful payment.

## Features

- Taxpayer login (Email / Mobile / Taxpayer ID + password)
- Dashboard with outstanding due and tax breakup
- Pay tax online (Razorpay checkout)
- Receipts list (PDF is emailed after each payment)

> The admin panel stays on the web. This app is the citizen-facing companion.

## 1. Configure the API URL

Edit `src/config.js` and set `API_BASE_URL` to your deployed backend, including
the `/api` suffix, e.g. `https://gp-ghirni-tax-api.onrender.com/api`.

## 2. Run in development

```bash
cd mobile
npm install
npx expo start
```

- Razorpay needs native code, so it does NOT work in plain Expo Go. Use a
  development build: `npx expo run:android` (needs Android Studio) or an EAS
  dev build (below).

## 3. Build an installable APK (for the website download)

The app is built in the cloud with EAS (no Android Studio needed):

```bash
npm install -g eas-cli
eas login
cd mobile
eas build:configure
eas build -p android --profile preview
```

`--profile preview` produces an **.apk** (see `eas.json`). When the build
finishes, EAS gives you a download URL. Download the `.apk`.

## 4. Serve the APK from the website

1. Put the downloaded file at `frontend/public/downloads/gp-ghirni-tax.apk`
   (commit it, or upload it to storage like Cloudinary / S3).
2. The website's download popup links to `VITE_APP_DOWNLOAD_URL` (set in
   Netlify) and falls back to `/downloads/gp-ghirni-tax.apk`.
   - If you host the APK elsewhere, set `VITE_APP_DOWNLOAD_URL` to that URL.

## 5. Publish to Play Store (optional)

```bash
eas build -p android --profile production   # builds an .aab
eas submit -p android
```

## Notes

- iOS: `eas build -p ios` (requires an Apple Developer account).
- Update `app.json` `android.versionCode` / `version` for each new release.
