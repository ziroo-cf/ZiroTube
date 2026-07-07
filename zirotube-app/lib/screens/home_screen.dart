import 'package:flutter/material.dart';

import '../data/categories.dart';
import '../models/media_model.dart';
import '../services/supabase_service.dart';
import '../theme/app_theme.dart';
import '../widgets/media_grid.dart';
import '../widgets/nav_rail.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  bool _isLoading = true;
  final Map<ContentCategory, List<MediaModel>> _content = {
    for (final c in kNavCategories) c: <MediaModel>[],
  };
  ContentCategory _selected = ContentCategory.live;
  final GlobalKey<NavRailState> _navRailKey = GlobalKey<NavRailState>();
  final SupabaseService _supabaseService = SupabaseService();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadContent();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _navRailKey.currentState?.focusSelected(_selected);
      });
    }
  }

  Future<void> _loadContent() async {
    try {
      final Map<ContentCategory, List<MediaModel>> next = {};
      await Future.wait(kNavCategories.map((category) async {
        next[category] = await _supabaseService.fetchMediaByCategory(category);
      }));

      if (!mounted) return;
      setState(() {
        _content
          ..clear()
          ..addAll(next);
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final counts = {
      for (final c in kNavCategories) c: _content[c]?.length ?? 0,
    };

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.background),
        child: Directionality(
          textDirection: TextDirection.ltr,
          child: Row(
            children: [
              Expanded(
                child: Directionality(
                  textDirection: TextDirection.rtl,
                  child: _isLoading
                      ? const Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  )
                      : _ContentArea(
                    category: _selected,
                    items: _content[_selected] ?? const [],
                  ),
                ),
              ),
              NavRail(
                key: _navRailKey,
                selected: _selected,
                counts: counts,
                onSelect: (category) => setState(() => _selected = category),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ContentArea extends StatelessWidget {
  final ContentCategory category;
  final List<MediaModel> items;

  const _ContentArea({required this.category, required this.items});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.lg,
                AppSpacing.sm,
              ),
              child: Text(category.label, style: AppText.sectionTitle),
            ),
            Expanded(
              child: MediaGrid(items: items),
            ),
          ],
        ),
        Positioned(
          top: AppSpacing.sm,
          left: AppSpacing.sm,
          child: _ItemCountBadge(count: items.length),
        ),
      ],
    );
  }
}

class _ItemCountBadge extends StatelessWidget {
  final int count;
  const _ItemCountBadge({required this.count});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.surface.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF1B2025)),
      ),
      child: Text(
        '$count فيديوهات ',
        style: const TextStyle(
          fontFamily: AppText.fontFamily,
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }
}