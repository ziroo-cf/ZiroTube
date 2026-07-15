import 'package:android_intent_plus/android_intent.dart';
import 'package:android_intent_plus/flag.dart';
import 'package:flutter/material.dart';
import 'package:installed_apps/installed_apps.dart';

Future<void> launchJustPlayer(
    BuildContext context, {
      required String videoUrl,
      required String title,
      required bool isTV,
    }) async {
  try {
    bool isInstalled = await InstalledApps.isAppInstalled('com.brouken.player') ?? false;

    if (isInstalled) {
      final intent = AndroidIntent(
        action: 'action_view',
        data: videoUrl,
        type: 'video/*',
        package: 'com.brouken.player',
        arguments: {
          'title': title,
          'input-library': 'exoplayer',
        },
        flags: [Flag.FLAG_ACTIVITY_NEW_TASK],
      );
      await intent.launch();
    } else {
      if (!context.mounted) return;
      await _handleMissingPlayer(context, isTV);
    }
  } catch (_) {
    if (!context.mounted) return;
    await _handleMissingPlayer(context, isTV);
  }
}

Future<void> _handleMissingPlayer(BuildContext context, bool isTV) async {
  if (isTV) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'تطبيق Just Player غير مثبت. يمكنك تثبيته من Downloader باستخدام الكود 2747416',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        backgroundColor: Colors.redAccent,
      ),
    );
  } else {
    try {
      final playStoreIntent = AndroidIntent(
        action: 'action_view',
        data: 'market://details?id=com.brouken.player',
      );
      await playStoreIntent.launch();
    } catch (_) {
      final webPlayStoreIntent = AndroidIntent(
        action: 'action_view',
        data: 'https://play.google.com/store/apps/details?id=com.brouken.player',
      );
      await webPlayStoreIntent.launch();
    }
  }
}