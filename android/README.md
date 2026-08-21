# Aether Android App

A thin TWA (Trusted Web Activity) wrapper around the Aether web app. It opens
the site inside Chrome's engine, so it looks and behaves exactly like the
website — and Google OAuth sign-in keeps working (plain WebViews block it).

## How it works

- `MainActivity` launches a Custom Tab to `site_url` (res/values/strings.xml)
- The site is served from Vercel: `https://aether-trillion-game.vercel.app`

## Requirements

- JDK 17+ (install a JDK, not the JRE)
- Android SDK (Android Studio "SDK Manager")
- `ANDROID_HOME` env var set

## Build

Open `android/` in Android Studio and run, or:

```
./gradlew assembleDebug
```

Release (signed) APK/AAB:

```
./gradlew assembleRelease    # APK
./gradlew bundleRelease      # AAB, for Play Store
```

## Store submission checklist

1. Point `res/values/strings.xml` `site_url` at the real production URL.
2. Sign the release build; get the SHA-256 fingerprint:
   `keytool -list -v -keystore your-release-key.jks -alias aether -storepass ...`
3. Put that fingerprint in `public/.well-known/assetlinks.json`
   (replace `REPLACE_WITH_APK_SIGNING_FINGERPRINT`) and redeploy the site —
   this is what lets the app claim the URL without showing a browser UI.
4. Create a Play Console app + Galaxy Store listing, upload the AAB,
   fill in store assets (icon, screenshots, privacy policy).

### Note on deployment

The current Vercel production deployments are failing to build (`● Error`),
and the site is behind Vercel's auth prompt. The app needs a public,
unauthenticated deployment to work for end users. Fix the build, redeploy,
then update `site_url`.
