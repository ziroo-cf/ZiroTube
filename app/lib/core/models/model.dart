import '../data/categories.dart';

class MediaModel {
  final String id;
  final String title;
  final String thumbnailUrl;
  final String videoUrl;
  final ContentCategory category;

  const MediaModel({
    required this.id,
    required this.title,
    required this.thumbnailUrl,
    required this.videoUrl,
    required this.category,
  });

  factory MediaModel.fromJson(Map<String, dynamic> json) {
    final String categoryStr = json['category'] as String? ?? '';

    final category = ContentCategory.values.firstWhere(
          (c) => c.jsonKey == categoryStr,
      orElse: () => ContentCategory.live,
    );

    return MediaModel(
      id: json['id']?.toString() ?? '',
      title: json['title'] as String? ?? '',
      thumbnailUrl: json['thumbnail_url'] as String? ?? '',
      videoUrl: json['video_url'] as String? ?? '',
      category: category,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'thumbnail_url': thumbnailUrl,
      'video_url': videoUrl,
      'category': category.jsonKey,
    };
  }
}



class SeriesModel {
  final String id;
  final String title;
  final String? thumbnailUrl;

  SeriesModel({
    required this.id,
    required this.title,
    this.thumbnailUrl,
  });

  factory SeriesModel.fromJson(Map<String, dynamic> json) => SeriesModel(
    id: json['id']?.toString() ?? '',
    title: json['title'] as String? ?? '',
    thumbnailUrl: json['thumbnail_url'] as String?,
  );
}

class EpisodeModel {
  final String id;
  final String seriesId;
  final int episodeNumber;
  final String videoUrl;
  final String? thumbnailUrl;

  EpisodeModel({
    required this.id,
    required this.seriesId,
    required this.episodeNumber,
    required this.videoUrl,
    this.thumbnailUrl,
  });

  factory EpisodeModel.fromJson(Map<String, dynamic> json) => EpisodeModel(
    id: json['id']?.toString() ?? '',
    seriesId: json['series_id']?.toString() ?? '',
    episodeNumber: json['episode_number'] as int? ?? 0,
    videoUrl: json['video_url'] as String? ?? '',
    thumbnailUrl: json['thumbnail_url'] as String?,
  );
}