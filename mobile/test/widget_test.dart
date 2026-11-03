import 'package:flutter_test/flutter_test.dart';
import 'package:viet_tour/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const VietTourApp());
    expect(find.byType(VietTourApp), findsOneWidget);
  });
}
