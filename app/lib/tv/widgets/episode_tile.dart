import 'package:flutter/material.dart';

import 'package:zirotube/core/models/model.dart';
import 'package:zirotube/core/theme/app_theme.dart';

class EpisodeTile extends StatefulWidget {
  final EpisodeModel episode;
  final bool autofocus;
  final FocusNode? focusNode;
  final VoidCallback onTap;

  const EpisodeTile({
    super.key,
    required this.episode,
    this.autofocus = false,
    this.focusNode,
    required this.onTap,
  });

  @override
  State<EpisodeTile> createState() => _EpisodeTileState();
}

class _EpisodeTileState extends State<EpisodeTile> {
  bool _isFocused = false;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: InkWell(
        autofocus: widget.autofocus,
        focusNode: widget.focusNode,
        borderRadius: BorderRadius.circular(12),
        focusColor: Colors.transparent,
        highlightColor: Colors.transparent,
        splashColor: Colors.transparent,
        onFocusChange: (hasFocus) => setState(() => _isFocused = hasFocus),
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: AppMotion.railExpand,
          curve: AppMotion.railCurve,
          height: 96,
          decoration: BoxDecoration(
            color: _isFocused ? AppColors.primary : AppColors.surface,
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
                  child: widget.episode.thumbnailUrl != null && widget.episode.thumbnailUrl!.isNotEmpty
                      ? Image.network(widget.episode.thumbnailUrl!, fit: BoxFit.cover)
                      : Container(color: AppColors.surfaceElevated),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Text(
                'الحلقة ${widget.episode.episodeNumber}',
                style: _isFocused
                    ? AppText.navLabel.copyWith(color: AppColors.bgBottom)
                    : AppText.navLabel,
              ),
              const SizedBox(width: AppSpacing.md),
            ],
          ),
        ),
      ),
    );
  }
}