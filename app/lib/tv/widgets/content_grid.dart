import 'package:flutter/material.dart';
import 'package:zirotube/core/theme/app_theme.dart';

class ContentGrid<T> extends StatelessWidget {
  final List<T> items;
  final Widget Function(T item, bool autofocus) itemBuilder;
  final Key pageStorageKey;

  const ContentGrid({
    super.key,
    required this.items,
    required this.itemBuilder,
    required this.pageStorageKey,
  });

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const Center(
        child: Text('لا يوجد محتوى بعد', style: AppText.body),
      );
    }

    final screenWidth = MediaQuery.of(context).size.width;
    final crossAxisCount = (screenWidth / 190).floor().clamp(1, 20);

    return GridView.builder(
      key: pageStorageKey,
      padding: const EdgeInsets.only(
        left: AppSpacing.lg,
        right: AppSpacing.lg,
        top: AppSpacing.sm,
        bottom: AppSpacing.lg,
      ),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        mainAxisSpacing: AppSpacing.md,
        crossAxisSpacing: AppSpacing.sm,
        childAspectRatio: 190 / 285,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) {
        return itemBuilder(items[index], index == 0);
      },
    );
  }
}