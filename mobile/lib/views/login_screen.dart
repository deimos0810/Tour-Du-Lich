import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool isRegister = false;
  final _emailController = TextEditingController(text: 'khach1@gmail.com');
  final _passwordController = TextEditingController(text: '123456');
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _cccdController = TextEditingController();

  bool _loading = false;
  String? _error;

  Future<void> _handleAuth() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      if (isRegister) {
        if (_nameController.text.trim().isEmpty || _phoneController.text.trim().isEmpty) {
          throw Exception('Vui lòng điền họ tên và số điện thoại');
        }
        await ApiService.register(
          email: _emailController.text.trim(),
          password: _passwordController.text,
          hoTen: _nameController.text.trim(),
          phone: _phoneController.text.trim(),
          cccd: _cccdController.text.trim().isNotEmpty ? _cccdController.text.trim() : null,
        );
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đăng ký thành công! Vui lòng đăng nhập.')),
        );
        setState(() {
          isRegister = false;
        });
      } else {
        final res = await ApiService.login(
          _emailController.text.trim(),
          _passwordController.text,
        );
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => HomeScreen(user: res['user']),
            ),
          );
        }
      }
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  void _fillDemo(String email, String role) {
    setState(() {
      _emailController.text = email;
      _passwordController.text = '123456';
      isRegister = false;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Đã chọn tài khoản Demo: $role')),
    );
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFF005BAA);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Card(
                elevation: 4,
                shadowColor: Colors.black12,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                color: Colors.white,
                child: Padding(
                  padding: const EdgeInsets.all(28.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // LOGO & HEADER
                      Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF005BAA), Color(0xFF0284C7)],
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Center(
                          child: Text(
                            'VT',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 26,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      const Text(
                        'VietTour Mobile',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const Text(
                        'Ứng dụng Lữ hành Đa nền tảng',
                        style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                      ),
                      const SizedBox(height: 24),

                      // ERROR MSG
                      if (_error != null)
                        Container(
                          padding: const EdgeInsets.all(12),
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEE2E2),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFFFCA5A5)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.error_outline, color: Color(0xFFDC2626), size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _error!,
                                  style: const TextStyle(color: Color(0xFFDC2626), fontSize: 13),
                                ),
                              ),
                            ],
                          ),
                        ),

                      if (isRegister) ...[
                        TextField(
                          controller: _nameController,
                          decoration: InputDecoration(
                            labelText: 'Họ và tên *',
                            prefixIcon: const Icon(Icons.person_outline),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                        const SizedBox(height: 14),
                        TextField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          decoration: InputDecoration(
                            labelText: 'Số điện thoại *',
                            prefixIcon: const Icon(Icons.phone_outlined),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                        const SizedBox(height: 14),
                        TextField(
                          controller: _cccdController,
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            labelText: 'Số CCCD (12 số)',
                            prefixIcon: const Icon(Icons.badge_outlined),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                        const SizedBox(height: 14),
                      ],

                      TextField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: InputDecoration(
                          labelText: 'Email tài khoản',
                          prefixIcon: const Icon(Icons.email_outlined),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                      const SizedBox(height: 14),
                      TextField(
                        controller: _passwordController,
                        obscureText: true,
                        decoration: InputDecoration(
                          labelText: 'Mật khẩu',
                          prefixIcon: const Icon(Icons.lock_outline),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // NÚT ĐĂNG NHẬP / ĐĂNG KÝ
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton(
                          onPressed: _loading ? null : _handleAuth,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: primaryColor,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                          child: _loading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                )
                              : Text(
                                  isRegister ? 'ĐĂNG KÝ TÀI KHOẢN' : 'ĐĂNG NHẬP',
                                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                                ),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // CHUYỂN ĐỔI GIỮA ĐĂNG NHẬP & ĐĂNG KÝ
                      TextButton(
                        onPressed: () {
                          setState(() {
                            isRegister = !isRegister;
                            _error = null;
                          });
                        },
                        child: Text(
                          isRegister
                              ? 'Đã có tài khoản? Đăng nhập ngay'
                              : 'Chưa có tài khoản? Đăng ký thành viên mới',
                          style: const TextStyle(color: primaryColor, fontWeight: FontWeight.w700),
                        ),
                      ),

                      const Divider(height: 32),

                      // NÚT DEMO NHANH CHO GIẢNG VIÊN CHẤM KHÓA LUẬN
                      const Text(
                        'TÀI KHOẢN KIỂM THỬ KHÓA LUẬN:',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF64748B), letterSpacing: 0.5),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => _fillDemo('khach1@gmail.com', 'Khách hàng'),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              child: const Text('Khách hàng', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => _fillDemo('hdv1@viettour.vn', 'HDV dẫn đoàn'),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              child: const Text('HDV Dẫn Đoàn', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
