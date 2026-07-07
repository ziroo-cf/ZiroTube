import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:material_symbols_icons/symbols.dart';

import '../data/categories.dart';
import '../models/media_model.dart';
import '../theme/app_theme.dart';
import '../utils/player_launcher.dart';

class MediaCard extends StatefulWidget {
  final MediaModel media;
  final bool autofocus;

  const MediaCard({
    super.key,
    required this.media,
    this.autofocus = false,
  });

  @override
  State<MediaCard> createState() => _MediaCardState();
}

class _MediaCardState extends State<MediaCard> {
  bool _isFocused = false;

  void _handleTap(BuildContext context) {
    if (!widget.media.category.isPlayable) {
      showComingSoon(context);
      return;
    }
    launchJustPlayer(context, videoUrl: widget.media.videoUrl, title: widget.media.title);
  }

  @override
  Widget build(BuildContext context) {
    final bool isLive = widget.media.category == ContentCategory.live;

    return RepaintBoundary(
      child: InkWell(
        autofocus: widget.autofocus,
        borderRadius: AppRadius.cardRadius,
        focusColor: Colors.transparent,
        highlightColor: Colors.transparent,
        splashColor: Colors.transparent,
        onFocusChange: (hasFocus) {
          setState(() => _isFocused = hasFocus);
          if (hasFocus) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (!context.mounted) return;
              Scrollable.ensureVisible(
                context,
                alignment: 0.5,
                duration: AppMotion.focusScale,
                curve: AppMotion.focusCurve,
              );
            });
          }
        },
        onTap: () => _handleTap(context),
        child: AnimatedScale(
          scale: _isFocused ? 1.12 : 1.0,
          duration: AppMotion.focusScale,
          curve: AppMotion.focusCurve,
          child: AnimatedContainer(
            duration: AppMotion.focusScale,
            curve: AppMotion.focusCurve,
            decoration: focusableCardDecoration(isFocused: _isFocused),
            child: ClipRRect(
              borderRadius: AppRadius.cardRadius,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  _Poster(media: widget.media),
                  if (isLive)
                    Positioned(
                      top: AppSpacing.xs,
                      right: AppSpacing.xs,
                      child: _LiveBadge(),
                    ),
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: 0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.xs,
                        vertical: AppSpacing.xs,
                      ),
                      decoration: const BoxDecoration(
                        gradient: AppColors.posterTitleOverlay,
                      ),
                      child: Text(
                        widget.media.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: AppText.cardTitle,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Poster extends StatelessWidget {
  final MediaModel media;
  const _Poster({required this.media});

  @override
  Widget build(BuildContext context) {
    if (media.thumbnailUrl.isEmpty) {
      return _PosterPlaceholder(category: media.category);
    }
    return CachedNetworkImage(
      imageUrl: media.thumbnailUrl,
      fit: BoxFit.cover,
      memCacheWidth: 320,
      fadeInDuration: const Duration(milliseconds: 120),
      placeholder: (_, _) => _PosterPlaceholder(category: media.category),
      errorWidget: (_, _, _) => _PosterPlaceholder(category: media.category),
    );
  }
}

class _PosterPlaceholder extends StatelessWidget {
  final ContentCategory category;
  const _PosterPlaceholder({required this.category});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.placeholder, AppColors.surface],
        ),
      ),
      child: Center(
        child: Icon(
          category.icon,
          color: Colors.white.withValues(alpha: 0.14),
          size: 44,
        ),
      ),
    );
  }
}

class _LiveBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFFE11D48),
        borderRadius: BorderRadius.circular(4),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Symbols.circle_rounded, size: 8, color: Colors.white),
          SizedBox(width: 4),
          Text(
            'مباشر',
            style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}