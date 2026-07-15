import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';

import 'package:zirotube/core/data/categories.dart';
import 'package:zirotube/core/theme/app_theme.dart';

const double _kRailWidth = 260.0;
const double _kIconZoneWidth = 56.0;

class NavRail extends StatefulWidget {
  final ContentCategory selected;
  final ValueChanged<ContentCategory> onSelect;
  final Map<ContentCategory, int> counts;

  const NavRail({
    super.key,
    required this.selected,
    required this.onSelect,
    required this.counts,
  });

  @override
  State<NavRail> createState() => _NavRailState();
}

class _NavRailState extends State<NavRail> {
  String _version = '';

  @override
  void initState() {
    super.initState();
    _loadVersion();
  }

  Future<void> _loadVersion() async {
    try {
      final info = await PackageInfo.fromPlatform();
      if (!mounted) return;
      setState(() => _version = info.version);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: Container(
        width: _kRailWidth,
        decoration: const BoxDecoration(
          color: AppColors.bgTop,
          border: Border(
            left: BorderSide(color: Color(0xFF1B2025), width: 1),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: AppSpacing.lg),
            const _Brand(),
            const SizedBox(height: AppSpacing.lg),
            for (final category in kNavCategories)
              _NavItem(
                category: category,
                isSelected: category == widget.selected,
                count: widget.counts[category] ?? 0,
                onTap: () => widget.onSelect(category),
              ),
            const Spacer(),
            _VersionLabel(version: _version),
            const SizedBox(height: AppSpacing.md),
          ],
        ),
      ),
    );
  }
}

class _Brand extends StatelessWidget {
  const _Brand();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
      child: Align(
        alignment: Alignment.center,
        child: const Text.rich(
          TextSpan(children: [
            TextSpan(text: 'Ziro', style: AppText.brand),
            TextSpan(
              text: 'Tube',
              style: TextStyle(
                fontFamily: AppText.fontFamily,
                fontSize: 30,
                fontWeight: FontWeight.w800,
                color: AppColors.primary,
                height: 1.0,
              ),
            ),
          ]),
          maxLines: 1,
          overflow: TextOverflow.clip,
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final ContentCategory category;
  final bool isSelected;
  final int count;
  final VoidCallback onTap;

  const _NavItem({
    required this.category,
    required this.isSelected,
    required this.count,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xs, vertical: 4),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onTap,
        child: Container(
          height: 52,
          decoration: BoxDecoration(
            color: isSelected ? AppColors.surfaceElevated : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            children: [
              SizedBox(
                width: _kIconZoneWidth,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Icon(
                      category.icon,
                      color: isSelected ? AppColors.primary : AppColors.textSecondary,
                      size: 26,
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        category.label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: isSelected ? AppText.navLabel : AppText.navLabelMuted,
                      ),
                    ),
                    if (count > 0) ...[
                      const SizedBox(width: AppSpacing.xs),
                      _CountChip(count: count),
                    ],
                    const SizedBox(width: AppSpacing.xs),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CountChip extends StatelessWidget {
  final int count;
  const _CountChip({required this.count});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        '$count',
        style: const TextStyle(
          fontFamily: AppText.fontFamily,
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }
}

class _VersionLabel extends StatelessWidget {
  final String version;
  const _VersionLabel({required this.version});

  @override
  Widget build(BuildContext context) {
    if (version.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
      child: Align(
        alignment: Alignment.center,
        child: Text(
          'الإصدار $version',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontFamily: AppText.fontFamily,
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}