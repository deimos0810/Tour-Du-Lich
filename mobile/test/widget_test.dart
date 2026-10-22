import 'package:flutter_test/flutter_test.dart';
import 'package:viettour_mobile/main.dart';

void main() {
  testWidgets('App loads smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const VietTourMobileApp());
    expect(find.text('VietTour Mobile'), findsOneWidget);
  });
}
