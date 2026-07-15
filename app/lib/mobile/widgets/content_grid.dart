import 'package:flutter/material.dart';
import 'package:zirotube/core/theme/app_theme.dart';

class ContentGrid<T> extends StatelessWidget {
  final List<T> items;
  final Widget Function(T item) itemBuilder;
  final Key pageStorageKey;
  final Widget? footer;

  const ContentGrid({
    super.key,
    required this.items,
    required this.itemBuilder,
    required this.pageStorageKey,
    this.footer,
  });

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const Center(
        child: Text('لا يوجد محتوى بعد', style: AppText.body),
      );
    }

    final screenWidth = MediaQuery.of(context).size.width;
    final crossAxisCount = (screenWidth / 200).clamp(2, 6).toInt();

    const padding = EdgeInsets.only(
      left: AppSpacing.lg,
      right: AppSpacing.lg,
      top: AppSpacing.sm,
      bottom: AppSpacing.lg,
    );

    final gridDelegate = SliverGridDelegateWithFixedCrossAxisCount(
      crossAxisCount: crossAxisCount,
      mainAxisSpacing: AppSpacing.md,
      crossAxisSpacing: AppSpacing.sm,
      childAspectRatio: 190 / 285,
    );

    final gridSliver = SliverGrid.builder(
      gridDelegate: gridDelegate,
      itemCount: items.length,
      itemBuilder: (context, index) => itemBuilder(items[index]),
    );

    if (footer == null) {
      return GridView.builder(
        key: pageStorageKey,
        padding: padding,
        gridDelegate: gridDelegate,
        itemCount: items.length,
        itemBuilder: (context, index) => itemBuilder(items[index]),
      );
    }

    return CustomScrollView(
      key: pageStorageKey,
      slivers: [
        SliverPadding(
          padding: padding,
          sliver: gridSliver,
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.md),
            child: footer,
          ),
        ),
      ],
    );
  }
}