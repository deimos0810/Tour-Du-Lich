import 'tour_model.dart';

class BookingModel {
  const BookingModel({
    required this.code,
    required this.tour,
    required this.departureDate,
    required this.adults,
    required this.children,
    required this.total,
    required this.status,
  });

  final String code;
  final TourModel tour;
  final DateTime departureDate;
  final int adults;
  final int children;
  final int total;
  final String status;
}
