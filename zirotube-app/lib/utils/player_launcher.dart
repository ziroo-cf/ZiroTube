import 'package:android_intent_plus/android_intent.dart';
import 'package:android_intent_plus/flag.dart';
import 'package:flutter/material.dart';

Future<void> launchJustPlayer(
    BuildContext context, {
      required String videoUrl,
      required String title,
    }) async {
  try {
    final intent = AndroidIntent(
      action: 'action_view',
      data: videoUrl,
      type: 'video/*',
      package: 'com.brouken.player',
      arguments: {'title': title},
      flags: [Flag.FLAG_ACTIVITY_NEW_TASK],
    );
    await intent.launch();
  } catch (_) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'تطبيق Just Player غير مثبت. يمكنك تثبيته من downloader باستخدام الكود 2747416',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }
}

void showComingSoon(BuildContext context) {
  ScaffoldMessenger.of(context).clearSnackBars();
  ScaffoldMessenger.of(context).showSnackBar(
    const SnackBar(
      content: Text(
        'المسلسلات قريباً',
        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
      ),
      backgroundColor: Color(0xFF1B2025),
      duration: Duration(seconds: 2),
    ),
  );
}