# ZiroTube App

Flutter application for **Android** and **Android TV**.

> This directory contains the complete Flutter application used by the ZiroTube project.

## Requirements

- Flutter (latest stable)
- Dart SDK
- Android Studio or VS Code
- Android SDK

## Getting Started

Clone the repository:

```bash
git clone https://github.com/ziroo-cf/zirotube.git
cd zirotube/app
```

Install dependencies:

```bash
flutter pub get
```

Run the application:

```bash
flutter run
```

Build APK:

```bash
flutter build apk
```

Build App Bundle:

```bash
flutter build appbundle
```

---

## Project Structure

```text
lib/
├── core/
│   ├── data/         # Shared data
│   ├── models/       # Data models
│   ├── services/     # Supabase and external services
│   ├── theme/        # Shared theme
│   └── utils/        # Utilities
│
├── mobile/
│   ├── screens/
│   └── widgets/
│
├── tv/
│   ├── screens/
│   └── widgets/
│
└── main.dart
```

---

## Assets

```text
assets/
├── fonts/
└── icon/
```

---

## Features

- Shared Flutter codebase
- Dedicated Android UI
- Dedicated Android TV UI
- Supabase integration
- External playback using Just Player
- Optimized for low-end Android TV devices

---

## Android TV

For the best playback experience, ZiroTube launches videos using **Just Player**.

If Just Player is not installed on Android TV:

- Downloader code: **9290513**
- Shortcut: http://aftv.news/9290513

---

## Related Documentation

- Project overview: [../README.md](../README.md)
- Website: https://zirotube.pages.dev