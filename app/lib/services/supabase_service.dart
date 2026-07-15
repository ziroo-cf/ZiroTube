import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../data/categories.dart';
import '../models/model.dart';

class SupabaseService {
  final SupabaseClient _client = Supabase.instance.client;

  Future<List<MediaModel>> fetchMediaByCategory(ContentCategory category) async {
    try {
      final response = await _client
          .from('media')
          .select()
          .eq('category', category.jsonKey)
          .order('created_at', ascending: false);
      return await compute(_parseMediaList, response as List<dynamic>);
    } catch (e) {
      debugPrint('Error fetching media for ${category.label}: $e');
      return [];
    }
  }

  Future<List<SeriesModel>> fetchAllSeries() async {
    try {
      final response = await _client
          .from('series')
          .select()
          .order('created_at', ascending: false);
      return await compute(_parseSeriesList, response as List<dynamic>);
    } catch (e) {
      debugPrint('Error fetching all series: $e');
      return [];
    }
  }

  Future<List<EpisodeModel>> fetchEpisodesForSeries(String seriesId) async {
    try {
      final response = await _client
          .from('episodes')
          .select()
          .eq('series_id', seriesId)
          .order('episode_number', ascending: true);
      return await compute(_parseEpisodeList, response as List<dynamic>);
    } catch (e) {
      debugPrint('Error fetching episodes for series $seriesId: $e');
      return [];
    }
  }
}

List<MediaModel> _parseMediaList(List<dynamic> data) {
  return data.map((json) => MediaModel.fromJson(json as Map<String, dynamic>)).toList();
}

List<SeriesModel> _parseSeriesList(List<dynamic> data) {
  return data.map((json) => SeriesModel.fromJson(json as Map<String, dynamic>)).toList();
}

List<EpisodeModel> _parseEpisodeList(List<dynamic> data) {
  return data.map((json) => EpisodeModel.fromJson(json as Map<String, dynamic>)).toList();
}