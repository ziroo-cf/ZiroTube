import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:material_symbols_icons/symbols.dart';
import 'package:zirotube/core/theme/app_theme.dart';

class ContentCard extends StatelessWidget {
  final String title;
  final String thumbnailUrl;
  final VoidCallback onTap;
  final IconData placeholderIcon;
  final bool isLive;

  const ContentCard({
    super.key,
    required this.title,
    required this.thumbnailUrl,
    required this.onTap,
    required this.placeholderIcon,
    this.isLive = false,
  });

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: InkWell(
        borderRadius: AppRadius.cardRadius,
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: AppRadius.cardRadius,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.2),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: AppRadius.cardRadius,
            child: Stack(
              fit: StackFit.expand,
              children: [
                _Poster(
                  thumbnailUrl: thumbnailUrl,
                  placeholderIcon: placeholderIcon,
                ),
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
                      title,
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
    );
  }
}

class _Poster extends StatelessWidget {
  final String thumbnailUrl;
  final IconData placeholderIcon;

  const _Poster({required this.thumbnailUrl, required this.placeholderIcon});

  @override
  Widget build(BuildContext context) {
    if (thumbnailUrl.isEmpty) {
      return _PosterPlaceholder(icon: placeholderIcon);
    }
    return CachedNetworkImage(
      imageUrl: thumbnailUrl,
      fit: BoxFit.contain,
      memCacheWidth: 320,
      fadeInDuration: const Duration(milliseconds: 120),
      placeholder: (_, __) => _PosterPlaceholder(icon: placeholderIcon),
      errorWidget: (_, __, ___) => _PosterPlaceholder(icon: placeholderIcon),
    );
  }
}

class _PosterPlaceholder extends StatelessWidget {
  final IconData icon;
  const _PosterPlaceholder({required this.icon});

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
          icon,
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