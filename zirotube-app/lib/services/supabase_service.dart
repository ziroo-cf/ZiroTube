import 'package:supabase_flutter/supabase_flutter.dart';
import '../data/categories.dart';
import '../models/media_model.dart';

class SupabaseService {
  final SupabaseClient _client = Supabase.instance.client;

  Future<List<MediaModel>> fetchMediaByCategory(
      ContentCategory category, {
        int limit = 18,
        int offset = 0,
      }) async {
    try {
      final response = await _client
          .from('media')
          .select()
          .eq('category', category.jsonKey)
          .order('created_at', ascending: false)
          .range(offset, offset + limit - 1);

      return (response as List)
          .map((json) => MediaModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }

  Future<Map<ContentCategory, int>> fetchCategoryCounts() async {
    final Map<ContentCategory, int> counts = {};

    try {
      final futures = kNavCategories.map((category) async {
        final countResponse = await _client
            .from('media')
            .count()
            .eq('category', category.jsonKey);
        return MapEntry(category, countResponse);
      });

      final results = await Future.wait(futures);
      counts.addEntries(results);
    } catch (_) {
      for (final category in kNavCategories) {
        counts[category] = 0;
      }
    }

    return counts;
  }
}