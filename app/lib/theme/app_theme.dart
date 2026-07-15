import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const Color bgTop = Color(0xFF101418);
  static const Color bgBottom = Color(0xFF070A0C);
  static const Color primary = Color(0xFF22C55E);
  static const Color textPrimary = Colors.white;
  static const Color textSecondary = Color(0xFFA3ABB2);
  static const Color surface = Color(0xFF15191C);
  static const Color surfaceElevated = Color(0xFF1B2025);
  static const Color placeholder = Color(0xFF1C2126);

  static const LinearGradient background = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [bgTop, bgBottom],
  );

  static const LinearGradient posterTitleOverlay = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Colors.transparent, Color(0xE6000000)],
    stops: [0.0, 1.0],
  );
}

class AppSpacing {
  AppSpacing._();

  static const double xs = 8;
  static const double sm = 16;
  static const double md = 24;
  static const double lg = 32;
  static const double xl = 48;
}

class AppRadius {
  AppRadius._();
  static const double card = 14;
  static const BorderRadius cardRadius = BorderRadius.all(Radius.circular(card));
}

class AppMotion {
  AppMotion._();
  static const Duration focusScale = Duration(milliseconds: 170);
  static const Curve focusCurve = Curves.easeOutCubic;
  static const Duration railExpand = Duration(milliseconds: 200);
  static const Curve railCurve = Curves.easeOutCubic;
  static const Duration railCollapseDebounce = Duration(milliseconds: 80);
}

class AppText {
  AppText._();
  static const String fontFamily = 'Cairo';
  static const TextStyle brand = TextStyle(
    fontFamily: fontFamily,
    fontSize: 30,
    fontWeight: FontWeight.w800,
    color: AppColors.textPrimary,
    height: 1.0,
  );

  static const TextStyle sectionTitle = TextStyle(
    fontFamily: fontFamily,
    fontSize: 24,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
  );

  static const TextStyle cardTitle = TextStyle(
    fontFamily: fontFamily,
    fontSize: 15,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
  );

  static const TextStyle navLabel = TextStyle(
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
  );

  static const TextStyle navLabelMuted = TextStyle(
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: AppColors.textSecondary,
  );

  static const TextStyle body = TextStyle(
    fontFamily: fontFamily,
    fontSize: 15,
    fontWeight: FontWeight.w400,
    color: AppColors.textSecondary,
  );
}

BoxDecoration focusableCardDecoration({required bool isFocused}) {
  return BoxDecoration(
    color: AppColors.surface,
    borderRadius: AppRadius.cardRadius,
    border: Border.all(
      color: isFocused ? AppColors.primary : Colors.transparent,
      width: 2,
    ),
    boxShadow: isFocused
        ? [
            BoxShadow(
              color: Colors.white.withValues(alpha: 0.18),
              blurRadius: 16,
              spreadRadius: 1,
            ),
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.25),
              blurRadius: 22,
              spreadRadius: 2,
            ),
          ]
        : [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.45),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
  );
}

ThemeData buildAppTheme() {
  return ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: AppColors.bgBottom,
    fontFamily: AppText.fontFamily,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      brightness: Brightness.dark,
      primary: AppColors.primary,
      surface: AppColors.surface,
    ),
    splashFactory: NoSplash.splashFactory,
    highlightColor: Colors.transparent,
    focusColor: Colors.transparent,
    hoverColor: Colors.transparent,
    visualDensity: VisualDensity.standard,
  );
}
