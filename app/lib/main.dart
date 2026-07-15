import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:device_info_plus/device_info_plus.dart';

import 'core/theme/app_theme.dart';
import 'tv/screens/home_screen.dart' as tv;
import 'mobile/screens/home_screen.dart' as mobile;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: 'https://tyroeuhknknxzjpcrgme.supabase.co',
    publishableKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cm9ldWhrbmtueHpqcGNyZ21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MzQ4OTIsImV4cCI6MjA5OTAxMDg5Mn0.tR4F52BCbxs41UXbinuGHzKmJpEOdVfUWNwKwqqtroo',
  );

  final deviceInfo = DeviceInfoPlugin();
  final androidInfo = await deviceInfo.androidInfo;
  final isTV = androidInfo.systemFeatures.contains('android.software.leanback');

  runApp(ZiroTubeApp(isTV: isTV));
}

class ZiroTubeApp extends StatelessWidget {
  final bool isTV;

  const ZiroTubeApp({super.key, required this.isTV});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ZiroTube',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      locale: const Locale('ar'),
      supportedLocales: const [Locale('ar')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: isTV ? const tv.HomeScreen() : const mobile.HomeScreen(),
    );
  }
}