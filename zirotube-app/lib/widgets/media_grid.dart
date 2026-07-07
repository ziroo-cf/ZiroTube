import 'package:flutter/material.dart';

import '../models/media_model.dart';
import '../theme/app_theme.dart';
import 'media_card.dart';

class MediaGrid extends StatelessWidget {
  final List<MediaModel> items;

  const MediaGrid({super.key, required this.items});

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const Center(
        child: Text('لا يوجد محتوى بعد', style: AppText.body),
      );
    }

    return GridView.builder(
      key: PageStorageKey(items.isNotEmpty ? items.first.category : 'empty'),
      padding: const EdgeInsets.only(
        left: AppSpacing.lg,
        right: AppSpacing.lg,
        top: AppSpacing.sm,
        bottom: AppSpacing.lg,
      ),
      scrollCacheExtent: .pixels(600.0),
      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 190,
        mainAxisSpacing: AppSpacing.md,
        crossAxisSpacing: AppSpacing.sm,
        childAspectRatio: 190 / 285,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) {
        return MediaCard(
          key: ValueKey(items[index].id),
          media: items[index],
          autofocus: index == 0,
        );
      },
    );
  }
}