import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../data/categories.dart';
import '../theme/app_theme.dart';

const double _kRailCollapsedWidth = 84;
const double _kRailExpandedWidth = 260;
const double _kIconZoneWidth = 56;
const double _kLabelRevealThreshold = 170;

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
  State<NavRail> createState() => NavRailState();
}

class NavRailState extends State<NavRail> {
  final FocusNode _boundaryNode = FocusNode(
    debugLabel: 'NavRailBoundary',
    skipTraversal: true,
    canRequestFocus: false,
  );
  late final Map<ContentCategory, FocusNode> _focusNodes = {
    for (final c in kNavCategories) c: FocusNode(debugLabel: 'nav-${c.jsonKey}'),
  };
  bool _expanded = false;
  bool _railHadFocus = false;
  String _version = '';

  @override
  void initState() {
    super.initState();
    FocusManager.instance.addListener(_handleGlobalFocusChange);
    _loadVersion();
  }

  Future<void> _loadVersion() async {
    try {
      final info = await PackageInfo.fromPlatform();
      if (!mounted) return;
      setState(() => _version = info.version);
    } catch (_) {}
  }

  void _handleGlobalFocusChange() {
    final hasFocus = _boundaryNode.hasFocus;

    if (hasFocus != _expanded) {
      setState(() => _expanded = hasFocus);
    }

    if (hasFocus && !_railHadFocus) {
      final target = _focusNodes[widget.selected];
      if (target != null && !target.hasFocus) {
        target.requestFocus();
      }
    }
    _railHadFocus = hasFocus;
  }

  void focusSelected(ContentCategory category) {
    _focusNodes[category]?.requestFocus();
  }

  @override
  void dispose() {
    FocusManager.instance.removeListener(_handleGlobalFocusChange);
    for (final node in _focusNodes.values) {
      node.dispose();
    }
    _boundaryNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: AnimatedContainer(
        duration: AppMotion.railExpand,
        curve: AppMotion.railCurve,
        width: _expanded ? _kRailExpandedWidth : _kRailCollapsedWidth,
        decoration: const BoxDecoration(
          color: AppColors.bgTop,
          border: Border(
            left: BorderSide(color: Color(0xFF1B2025), width: 1),
          ),
        ),
        child: Focus(
          focusNode: _boundaryNode,
          child: LayoutBuilder(
            builder: (context, constraints) {
              final bool showLabels = constraints.maxWidth > _kLabelRevealThreshold;

              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: AppSpacing.lg),
                  _Brand(showLabel: showLabels),
                  const SizedBox(height: AppSpacing.lg),
                  for (final category in kNavCategories)
                    _NavItem(
                      category: category,
                      showLabel: showLabels,
                      isSelected: category == widget.selected,
                      focusNode: _focusNodes[category]!,
                      count: widget.counts[category] ?? 0,
                      onTap: () => widget.onSelect(category),
                    ),
                  const Spacer(),
                  _VersionLabel(showLabel: showLabels, version: _version),
                  const SizedBox(height: AppSpacing.md),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _Brand extends StatelessWidget {
  final bool showLabel;
  const _Brand({required this.showLabel});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
      child: Align(
        alignment: Alignment.center,
        child: showLabel
            ? const Text.rich(
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
        )
            : const Text.rich(
          TextSpan(
            children: [
              TextSpan(text: 'Z', style: AppText.brand),
              TextSpan(
                text: 'T',
                style: TextStyle(
                  fontFamily: AppText.fontFamily,
                  fontSize: 30,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primary,
                  height: 1.0,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final ContentCategory category;
  final bool showLabel;
  final bool isSelected;
  final FocusNode focusNode;
  final int count;
  final VoidCallback onTap;

  const _NavItem({
    required this.category,
    required this.showLabel,
    required this.isSelected,
    required this.focusNode,
    required this.count,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xs, vertical: 4),
      child: _NavItemFocusBuilder(
        focusNode: focusNode,
        onTap: onTap,
        builder: (isFocused) {
          final Color iconColor = isFocused
              ? AppColors.bgBottom
              : (isSelected ? AppColors.primary : AppColors.textSecondary);

          return AnimatedContainer(
            duration: AppMotion.railExpand,
            curve: AppMotion.railCurve,
            height: 52,
            decoration: BoxDecoration(
              color: isFocused
                  ? AppColors.primary
                  : (isSelected ? AppColors.surfaceElevated : Colors.transparent),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                SizedBox(
                  width: _kIconZoneWidth,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Icon(category.icon, color: iconColor, size: 26),
                    ],
                  ),
                ),
                Expanded(
                  child: !showLabel
                      ? const SizedBox.shrink()
                      : Row(
                    children: [
                      Expanded(
                        child: Text(
                          category.label,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: isFocused
                              ? AppText.navLabel.copyWith(color: AppColors.bgBottom)
                              : (isSelected ? AppText.navLabel : AppText.navLabelMuted),
                        ),
                      ),
                      if (count > 0) ...[
                        const SizedBox(width: AppSpacing.xs),
                        _CountChip(count: count, isFocused: isFocused),
                      ],
                      const SizedBox(width: AppSpacing.xs),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _CountChip extends StatelessWidget {
  final int count;
  final bool isFocused;
  const _CountChip({required this.count, required this.isFocused});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: isFocused ? AppColors.bgBottom.withValues(alpha: 0.15) : AppColors.surface,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        '$count',
        style: TextStyle(
          fontFamily: AppText.fontFamily,
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: isFocused ? AppColors.bgBottom : AppColors.textSecondary,
        ),
      ),
    );
  }
}

class _VersionLabel extends StatelessWidget {
  final bool showLabel;
  final String version;
  const _VersionLabel({required this.showLabel, required this.version});

  @override
  Widget build(BuildContext context) {
    if (version.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
      child: Align(
        alignment: Alignment.center,
        child: Text(
          showLabel ? 'الإصدار $version' : 'v$version',
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

class _NavItemFocusBuilder extends StatefulWidget {
  final FocusNode focusNode;
  final VoidCallback onTap;
  final Widget Function(bool isFocused) builder;

  const _NavItemFocusBuilder({
    required this.focusNode,
    required this.onTap,
    required this.builder,
  });

  @override
  State<_NavItemFocusBuilder> createState() => _NavItemFocusBuilderState();
}

class _NavItemFocusBuilderState extends State<_NavItemFocusBuilder> {
  bool _isFocused = false;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      focusNode: widget.focusNode,
      borderRadius: BorderRadius.circular(10),
      focusColor: Colors.transparent,
      highlightColor: Colors.transparent,
      splashColor: Colors.transparent,
      onFocusChange: (hasFocus) => setState(() => _isFocused = hasFocus),
      onTap: widget.onTap,
      child: widget.builder(_isFocused),
    );
  }
}