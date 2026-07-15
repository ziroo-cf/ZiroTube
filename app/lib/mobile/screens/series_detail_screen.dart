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

class _SeriesDetailScreenState extends State<SeriesDetailScreen> {
  final SupabaseService _supabaseService = SupabaseService();
  bool _isLoading = true;
  List<EpisodeModel> _episodes = [];
  String? _lastPlayedEpisodeId;

  @override
  void initState() {
    super.initState();
    _loadEpisodes();
  }

  Future<void> _loadEpisodes() async {
    try {
      final episodes = await _supabaseService.fetchEpisodesForSeries(widget.series.id);
      if (!mounted) return;
      setState(() {
        _episodes = episodes;
        _isLoading = false;
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
      title: '${widget.series.title} الحلقة ${episode.episodeNumber}',
      isTV: false,
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