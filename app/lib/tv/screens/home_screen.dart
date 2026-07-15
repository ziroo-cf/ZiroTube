import 'package:flutter/material.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../data/categories.dart';
import '../models/model.dart';
import '../screens/series_detail_screen.dart';
import '../services/supabase_service.dart';
import '../theme/app_theme.dart';
import '../widgets/content_card.dart';
import '../widgets/content_grid.dart';
import '../widgets/nav_rail.dart';
import '../utils/player_launcher.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  bool _isLoading = true;
  bool _hasError = false;
  final Map<ContentCategory, List<MediaModel>> _content = {
    for (final c in kNavCategories.where((c) => c != ContentCategory.series)) c: <MediaModel>[],
  };
  List<SeriesModel> _series = [];
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
      // Only refocus nav rail if we are on the home screen (no detail screens above)
      if (!Navigator.of(context).canPop()) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _navRailKey.currentState?.focusSelected(_selected);
        });
      }
    }
  }

  Future<void> _loadContent() async {
    setState(() {
      _isLoading = true;
      _hasError = false;
    });
    try {
      final mediaCategories = kNavCategories.where((c) => c != ContentCategory.series);
      final results = await Future.wait([
        Future.wait(mediaCategories.map((category) async {
          final items = await _supabaseService.fetchMediaByCategory(category);
          _content[category] = items;
        })),
        _supabaseService.fetchAllSeries(),
      ]);

      final seriesResult = results[1] as List<SeriesModel>;
      if (!mounted) return;
      setState(() {
        _series = seriesResult;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _hasError = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final counts = {
      for (final c in kNavCategories)
        c: c == ContentCategory.series ? _series.length : (_content[c]?.length ?? 0),
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
                  child: _buildContent(),
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

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      );
    }
    if (_hasError) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'حدث خطأ أثناء تحميل المحتوى',
              style: AppText.body,
            ),
            const SizedBox(height: AppSpacing.md),
            ElevatedButton(
              onPressed: _loadContent,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.bgBottom,
              ),
              child: const Text('إعادة المحاولة'),
            ),
          ],
        ),
      );
    }

    final isSeries = _selected == ContentCategory.series;
    final title = isSeries ? ContentCategory.series.label : _selected.label;
    final child = isSeries
        ? ContentGrid<SeriesModel>(
      key: const PageStorageKey('series'),
      items: _series,
      pageStorageKey: const PageStorageKey('series'),
      itemBuilder: (series, autofocus) => ContentCard(
        title: series.title,
        thumbnailUrl: series.thumbnailUrl ?? '',
        placeholderIcon: Symbols.video_library_rounded,
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => SeriesDetailScreen(series: series),
            ),
          );
        },
        autofocus: autofocus,
      ),
    )
        : ContentGrid<MediaModel>(
      key: PageStorageKey(_selected),
      items: _content[_selected] ?? const [],
      pageStorageKey: PageStorageKey(_selected),
      itemBuilder: (media, autofocus) => ContentCard(
        title: media.title,
        thumbnailUrl: media.thumbnailUrl,
        placeholderIcon: media.category.icon,
        isLive: media.category == ContentCategory.live,
        onTap: () {
          launchJustPlayer(
            context,
            videoUrl: media.videoUrl,
            title: media.title,
          );
        },
        autofocus: autofocus,
      ),
    );

    return _ContentArea(title: title, child: child);
  }
}

class _ContentArea extends StatelessWidget {
  final String title;
  final Widget child;

  const _ContentArea({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.lg,
            AppSpacing.lg,
            AppSpacing.sm,
          ),
          child: Text(title, style: AppText.sectionTitle),
        ),
        Expanded(child: child),
      ],
    );
  }
}