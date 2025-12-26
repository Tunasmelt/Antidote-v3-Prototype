import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import 'utils/theme.dart';
import 'screens/home_screen.dart';
import 'screens/analysis_screen.dart';
import 'screens/battle_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/music_assistant_screen.dart';
import 'widgets/mobile_layout.dart';

void main() {
  runApp(const ProviderScope(child: AntidoteApp()));
}

class AntidoteApp extends StatelessWidget {
  const AntidoteApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Antidote v3',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.theme,
      routerConfig: _router,
    );
  }
}

final GoRouter _router = GoRouter(
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const MobileLayout(child: HomeScreen()),
    ),
    GoRoute(
      path: '/analysis',
      builder: (context, state) => const MobileLayout(child: AnalysisScreen()),
    ),
    GoRoute(
      path: '/battle',
      builder: (context, state) => const MobileLayout(child: BattleScreen()),
    ),
    GoRoute(
      path: '/profile',
      builder: (context, state) => const MobileLayout(child: ProfileScreen()),
    ),
    GoRoute(
      path: '/music-assistant',
      builder: (context, state) => const MobileLayout(child: MusicAssistantScreen()),
    ),
  ],
);
