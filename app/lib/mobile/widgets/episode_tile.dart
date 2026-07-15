import 'package:flutter/material.dart';

import 'package:zirotube/core/models/model.dart';
import 'package:zirotube/core/theme/app_theme.dart';

class EpisodeTile extends StatelessWidget {
  final EpisodeModel episode;
  final VoidCallback onTap;

  const EpisodeTile({
    super.key,
    required this.episode,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Container(
          height: 96,
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF1B2025)),
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.horizontal(right: Radius.circular(12)),
                child: SizedBox(
                  width: 160,
                  height: 96,
                  child: episode.thumbnailUrl != null && episode.thumbnailUrl!.isNotEmpty
                      ? Image.network(episode.thumbnailUrl!, fit: BoxFit.cover)
                      : Container(color: AppColors.surfaceElevated),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Text(
                'الحلقة ${episode.episodeNumber}',
                style: AppText.navLabel,
              ),
              const SizedBox(width: AppSpacing.md),
            ],
          ),
        ),
      ),
    );
  }
}