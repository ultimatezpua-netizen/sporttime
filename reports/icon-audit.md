# Android icon audit

Date: 2026-07-30

## Result

The app uses the supported Expo icon-font implementation from
`@expo/vector-icons` 15.1.1:

- `Ionicons` for the main application UI;
- `Feather` for the classic tab bar and the error fallback;
- `expo-symbols`/`SymbolView` and `expo-router/unstable-native-tabs` only for
  the iOS liquid-glass/native-tab path.

No Lucide, Font Awesome package, standalone `react-native-vector-icons`, or
custom SVG icon package was found in application imports.

## Confirmed cause

The application loaded Inter through the root `useFonts` gate, but did not
register the two icon-font families in that same gate. `@expo/vector-icons`
does include the TTF files and can lazy-load them per component, but relying on
that lazy path leaves a release/native timing window: screens can mount while
the Android `Text` renderer does not yet have the matching font family
registered. Android then renders the missing glyph fallback, which appears as
a square/rectangle with an X. Web and development previews can hide this
because Metro/web asset handling and reload timing are different.

The fix is to load `Ionicons.font` and `Feather.font` together with Inter in
`app/_layout.tsx`, before native screens are mounted.

## Glyph audit

- Ionicons glyph map: 1,357 names.
- Feather glyph map: 287 names.
- All statically used Ionicons and Feather names were checked against their
  package glyph maps.
- Unknown static icon names: none.
- `Ionicons.ttf`: present, 389,724 bytes.
- `Feather.ttf`: present, 55,596 bytes.

Dynamic icon names in settings, payment, catalog filters, and product
features continue to use the Ionicons type/known data paths.

## Release asset verification

`pnpm exec expo export --platform android --output-dir /tmp/sporttime-android-export`
completed successfully.

The Android export produced a Hermes bundle and included both icon fonts in
the Metro asset graph:

- `Ionicons.ttf` export asset MD5:
  `b4eb097d35f44ed943676fd56f6bdc51`
- `Feather.ttf` export asset MD5:
  `ca4b48e04dc1ce10bfbddb262c8b835f`

The hashes match the source files under `@expo/vector-icons`, so the release
asset pipeline is not dropping or rewriting these fonts.

## Changed files

- `app/_layout.tsx`
  - imports `Ionicons` and `Feather`;
  - adds both `...Ionicons.font` and `...Feather.font` to the existing
    `useFonts` map.
- `components/SafeIonicons.tsx`
  - documents that all Ionicons usage relies on the centralized root
    registration.

No new dependency, native plugin, Android project, or icon library was added.

## Validation

Passed:

- TypeScript check: `pnpm exec tsc --noEmit`.
- `git diff --check`.
- Static glyph-map audit.
- Android Expo production export.
- Android Metro production bundle generation.
- Expo workflow restart and clean Metro logs after the change.

Not possible in this container:

- local APK/AAB build;
- APK installation through ADB;
- visual confirmation on a physical Android device.

The workspace has no `android/` directory, Java/JDK, Android SDK,
`ANDROID_HOME`, `ANDROID_SDK_ROOT`, Gradle, or ADB. Therefore this audit does
not claim that a physical-device release test was completed. The remaining
acceptance check is to install the exported/release Android build on a real
Android device and verify the tab bar, header, catalog, product, checkout, and
settings icons.