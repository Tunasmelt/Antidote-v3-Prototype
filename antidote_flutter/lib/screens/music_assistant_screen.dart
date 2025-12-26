import 'package:flutter/material.dart';
import '../utils/theme.dart';

class MusicAssistantScreen extends StatelessWidget {
  const MusicAssistantScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.auto_fix_high,
              size: 64,
              color: AppTheme.success,
            ),
            const SizedBox(height: 16),
            Text(
              'Music Decision Assistant',
              style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'AI-powered music recommendations',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppTheme.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
