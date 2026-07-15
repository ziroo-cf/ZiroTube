import 'package:flutter/material.dart';
import 'package:material_symbols_icons/symbols.dart';
import 'package:package_info_plus/package_info_plus.dart';

import 'package:zirotube/core/data/categories.dart';
import 'package:zirotube/core/models/model.dart';
import 'package:zirotube/core/services/supabase_service.dart';
import 'package:zirotube/core/theme/app_theme.dart';
import 'package:zirotube/core/utils/player_launcher.dart';

import '../widgets/content_card.dart';
import '../widgets/content_grid.dart';
import 'series_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _isLoading = true;
  bool _hasError = false;
  final Map<ContentCategory, List<MediaModel>> _content = {
    for (final c in kNavCategories.where((c) => c != ContentCategory.series)) c: <MediaModel>[],
  };
  List<SeriesModel> _series = [];
  ContentCategory _selected = ContentCategory.live;
  final SupabaseService _supabaseService = SupabaseService();
  String _version = '';

  @override
  void initState() {
    super.initState();
    _loadContent();
    _loadVersion();
  }

  Future<void> _loadVersion() async {
    try {
      final info = await PackageInfo.fromPlatform();
      if (!mounted) return;
      setState(() => _version = info.version);
    } catch (_) {}
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

  int _getCurrentCount() {
    if (_selected == ContentCategory.series) {
      return _series.length;
    }
    return _content[_selected]?.length ?? 0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.background),
        child: Directionality(
          textDirection: TextDirection.rtl,
          child: _buildContent(),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: kNavCategories.indexOf(_selected),
        type: BottomNavigationBarType.fixed,
        backgroundColor: AppColors.bgTop,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textSecondary,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold),
        unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.normal),
        onTap: (index) {
          setState(() {
            _selected = kNavCategories[index];
          });
        },
        items: kNavCategories.map((category) {
          return BottomNavigationBarItem(
            icon: Icon(category.icon, size: 26),
            label: category.label,
          );
        }).toList(),
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
    final count = _getCurrentCount();

    final footer = _version.isNotEmpty
        ? Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
      child: Text(
        'الإصدار $_version',
        style: const TextStyle(
          fontFamily: AppText.fontFamily,
          fontSize: 11,
          fontWeight: FontWeight.w400,
          color: AppColors.textSecondary,
        ),
        textAlign: TextAlign.center,
      ),
    )
        : null;

    final child = isSeries
        ? ContentGrid<SeriesModel>(
      key: const PageStorageKey('series'),
      items: _series,
      pageStorageKey: const PageStorageKey('series'),
      itemBuilder: (series) => ContentCard(
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
      ),
      footer: footer,
    )
        : ContentGrid<MediaModel>(
      key: PageStorageKey(_selected),
      items: _content[_selected] ?? const [],
      pageStorageKey: PageStorageKey(_selected),
      itemBuilder: (media) => ContentCard(
        title: media.title,
        thumbnailUrl: media.thumbnailUrl,
        placeholderIcon: media.category.icon,
        isLive: media.category == ContentCategory.live,
        onTap: () {
          launchJustPlayer(
            context,
            videoUrl: media.videoUrl,
            title: media.title,
            isTV: false,
          );
        },
      ),
      footer: footer,
    );

    return _ContentArea(title: title, count: count, child: child);
  }
}

class _ContentArea extends StatelessWidget {
  final String title;
  final int count;
  final Widget child;

  const _ContentArea({
    required this.title,
    required this.count,
    required this.child,
  });

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
          child: Row(
            children: [
              Text(title, style: AppText.sectionTitle),
              const SizedBox(width: AppSpacing.sm),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$count',
                  style: AppText.navLabel.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
        Expanded(child: child),
      ],
    );
  }
}