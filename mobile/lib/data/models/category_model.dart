import 'package:flutter/material.dart';

class CategoryModel {
  const CategoryModel({
    required this.title,
    required this.icon,
    required this.color,
    required this.query,
  });

  final String title;
  final IconData icon;
  final Color color;
  final String query;
}
