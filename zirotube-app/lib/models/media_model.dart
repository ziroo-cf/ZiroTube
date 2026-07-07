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