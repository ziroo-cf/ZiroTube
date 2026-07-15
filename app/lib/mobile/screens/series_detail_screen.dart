import 'package:flutter/material.dart';

import 'package:zirotube/core/models/model.dart';
import 'package:zirotube/core/services/supabase_service.dart';
import 'package:zirotube/core/theme/app_theme.dart';
import 'package:zirotube/core/utils/player_launcher.dart';

import '../widgets/episode_tile.dart';

class SeriesDetailScreen extends StatefulWidget {
  final SeriesModel series;

  const SeriesDetailScreen({super.key, required this.series});

  @override
  State<SeriesDetailScreen> createState() => _SeriesDetailScreenState();
}

class _SeriesDetailScreenState extends State<SeriesDetailScreen> with WidgetsBindingObserver {
  final SupabaseService _supabaseService = SupabaseService();
  bool _isLoading = true;
  List<EpisodeModel> _episodes = [];
  String? _lastPlayedEpisodeId;
  final List<FocusNode> _episodeFocusNodes = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadEpisodes();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    for (final node in _episodeFocusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      if (mounted && ModalRoute.of(context)?.isCurrent == true) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _restoreFocus();
        });
      }
    }
  }

  void _restoreFocus() {
    if (_episodes.isEmpty) return;
    int indexToFocus = 0;
    if (_lastPlayedEpisodeId != null) {
      final index = _episodes.indexWhere((e) => e.id == _lastPlayedEpisodeId);
      if (index != -1) {
        indexToFocus = index;
      }
    }
    if (indexToFocus < _episodeFocusNodes.length) {
      _episodeFocusNodes[indexToFocus].requestFocus();
    }
  }

  Future<void> _loadEpisodes() async {
    try {
      final episodes = await _supabaseService.fetchEpisodesForSeries(widget.series.id);
      if (!mounted) return;
      setState(() {
        _episodes = episodes;
        _isLoading = false;
        _episodeFocusNodes.clear();
        for (int i = 0; i < episodes.length; i++) {
          _episodeFocusNodes.add(FocusNode());
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
    }
  }

  void _openPlayer(EpisodeModel episode) {
    setState(() {
      _lastPlayedEpisodeId = episode.id;
    });
    launchJustPlayer(
      context,
      videoUrl: episode.videoUrl,
      title: 'الحلقة ${episode.episodeNumber}',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppColors.background),
        child: Directionality(
          textDirection: TextDirection.rtl,
          child: SafeArea(
            child: _isLoading
                ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
                : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.lg,
                    AppSpacing.lg,
                    AppSpacing.lg,
                    AppSpacing.sm,
                  ),
                  child: Text(widget.series.title, style: AppText.sectionTitle),
                ),
                Expanded(
                  child: _episodes.isEmpty
                      ? const Center(
                    child: Text('لا توجد حلقات بعد', style: AppText.body),
                  )
                      : ListView.builder(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg,
                      vertical: AppSpacing.sm,
                    ),
                    itemCount: _episodes.length,
                    itemBuilder: (context, index) {
                      return EpisodeTile(
                        key: ValueKey(_episodes[index].id),
                        episode: _episodes[index],
                        autofocus: index == 0 && _lastPlayedEpisodeId == null,
                        focusNode: _episodeFocusNodes[index],
                        onTap: () => _openPlayer(_episodes[index]),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}