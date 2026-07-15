import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:material_symbols_icons/symbols.dart';
import '../theme/app_theme.dart';

class ContentCard extends StatefulWidget {
  final String title;
  final String thumbnailUrl;
  final VoidCallback onTap;
  final IconData placeholderIcon;
  final bool isLive;
  final bool autofocus;

  const ContentCard({
    super.key,
    required this.title,
    required this.thumbnailUrl,
    required this.onTap,
    required this.placeholderIcon,
    this.isLive = false,
    this.autofocus = false,
  });

  @override
  State<ContentCard> createState() => _ContentCardState();
}

class _ContentCardState extends State<ContentCard> {
  bool _isFocused = false;

  @override
  Widget build(BuildContext context) {
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
        onTap: widget.onTap,
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
                  _Poster(
                    thumbnailUrl: widget.thumbnailUrl,
                    placeholderIcon: widget.placeholderIcon,
                  ),
                  if (widget.isLive)
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
                        widget.title,
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
      placeholder: (_, _) => _PosterPlaceholder(icon: placeholderIcon),
      errorWidget: (_, _, _) => _PosterPlaceholder(icon: placeholderIcon),
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