import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'views/home_screen.dart';
import 'views/login_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final userDataStr = prefs.getString('user_data');
  Map<String, dynamic>? initialUser;
  if (userDataStr != null) {
    try {
      initialUser = jsonDecode(userDataStr);
    } catch (_) {}
  }

  runApp(VietTourMobileApp(initialUser: initialUser));
}

class VietTourMobileApp extends StatelessWidget {
  final Map<String, dynamic>? initialUser;

  const VietTourMobileApp({super.key, this.initialUser});

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFF005BAA);

    return MaterialApp(
      title: 'VietTour Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: primaryColor,
          primary: primaryColor,
          surface: Colors.white,
        ),
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        appBarTheme: const AppBarTheme(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          centerTitle: false,
          elevation: 0,
        ),
        cardTheme: CardThemeData(
          elevation: 2,
          shadowColor: Colors.black12,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          color: Colors.white,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: primaryColor,
            foregroundColor: Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ),
      home: initialUser != null ? HomeScreen(user: initialUser) : const LoginScreen(),
    );
  }
}
