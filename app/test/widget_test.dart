import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:zirotube/main.dart';

void main() {
  setUpAll(() async {
    await Supabase.initialize(
      url: 'https://mock.supabase.co',
      publishableKey: 'mock',
    );
  });

  testWidgets('App loads successfully test', (WidgetTester tester) async {
    await tester.pumpWidget(const ZiroTubeApp());
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}