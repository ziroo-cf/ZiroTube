import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'screens/home_screen.dart';
import 'theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: 'https://tyroeuhknknxzjpcrgme.supabase.co',
    publishableKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cm9ldWhrbmtueHpqcGNyZ21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MzQ4OTIsImV4cCI6MjA5OTAxMDg5Mn0.tR4F52BCbxs41UXbinuGHzKmJpEOdVfUWNwKwqqtroo',
  );

  runApp(const ZiroTubeApp());
}

class ZiroTubeApp extends StatelessWidget {
  const ZiroTubeApp({super.key});

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
      home: const HomeScreen(),
    );
  }
}