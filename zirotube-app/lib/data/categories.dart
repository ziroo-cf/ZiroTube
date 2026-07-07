import 'package:material_symbols_icons/symbols.dart';
import 'package:flutter/widgets.dart';

enum ContentCategory {
  live,
  kidsMovies,
  kidsSeries,
  translatedMovies,
}

extension ContentCategoryX on ContentCategory {
  String get jsonKey {
    switch (this) {
      case ContentCategory.live:
        return 'live';
      case ContentCategory.kidsMovies:
        return 'kids_movies';
      case ContentCategory.kidsSeries:
        return 'kids_series';
      case ContentCategory.translatedMovies:
        return 'translated_movies';
    }
  }

  String get label {
    switch (this) {
      case ContentCategory.live:
        return 'القنوات';
      case ContentCategory.kidsMovies:
        return 'أفلام الأطفال';
      case ContentCategory.kidsSeries:
        return 'مسلسلات الأطفال';
      case ContentCategory.translatedMovies:
        return 'أفلام مترجمة';
    }
  }

  IconData get icon {
    switch (this) {
      case ContentCategory.live:
        return Symbols.live_tv_rounded;
      case ContentCategory.kidsMovies:
        return Symbols.child_care_rounded;
      case ContentCategory.kidsSeries:
        return Symbols.video_library_rounded;
      case ContentCategory.translatedMovies:
        return Symbols.subtitles_rounded;
    }
  }

  bool get isPlayable => this != ContentCategory.kidsSeries;
}

const List<ContentCategory> kNavCategories = [
  ContentCategory.live,
  ContentCategory.kidsMovies,
  ContentCategory.kidsSeries,
  ContentCategory.translatedMovies,
];
