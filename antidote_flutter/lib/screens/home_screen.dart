import 'package:flutter/material.dart';
import '../utils/theme.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin {
  late AnimationController _logoController;
  late AnimationController _backgroundController;
  
  @override
  void initState() {
    super.initState();
    
    // Logo animation controller
    _logoController = AnimationController(
      duration: const Duration(seconds: 4),
      vsync: this,
    )..repeat();
    
    // Background zoom controller
    _backgroundController = AnimationController(
      duration: const Duration(seconds: 8),
      vsync: this,
    )..repeat(reverse: true);
  }
  
  @override
  void dispose() {
    _logoController.dispose();
    _backgroundController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Animated Cosmic Background
        AnimatedBuilder(
          animation: _backgroundController,
          builder: (context, child) {
            return Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    AppTheme.background,
                    AppTheme.cardBackground.withOpacity(0.3),
                    AppTheme.background,
                  ],
                ),
              ),
            );
          },
        ),
        
        // Main Content
        SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              children: [
                const SizedBox(height: 60), // Status bar spacing
                
                // Hero Section
                SizedBox(
                  height: 420,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Animated Logo
                      AnimatedBuilder(
                        animation: _logoController,
                        builder: (context, child) {
                          return Transform.translate(
                            offset: Offset(
                              0,
                              sin(_logoController.value * 2 * 3.14159) * 10,
                            ),
                            child: Transform.rotate(
                              angle: sin(_logoController.value * 2 * 3.14159) * 0.1,
                              child: Container(
                                width: 96,
                                height: 96,
                                decoration: BoxDecoration(
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppTheme.primary.withOpacity(0.6),
                                      blurRadius: 20,
                                      spreadRadius: 0,
                                    ),
                                  ],
                                ),
                                child: Icon(
                                  Icons.music_note,
                                  size: 48,
                                  color: AppTheme.primary,
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                      
                      const SizedBox(height: 16),
                      
                      // Animated Title
                      AnimatedBuilder(
                        animation: _logoController,
                        builder: (context, child) {
                          final shadowOffset = sin(_logoController.value * 2 * 3.14159) * 2 + 2;
                          return Text(
                            'ANTIDOTE',
                            style: Theme.of(context).textTheme.displayLarge?.copyWith(
                              shadows: [
                                Shadow(
                                  color: AppTheme.primary.withOpacity(1),
                                  offset: Offset(0, shadowOffset),
                                  blurRadius: shadowOffset * 2,
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                      
                      const SizedBox(height: 8),
                      
                      // Subtitle
                      Text(
                        'Discover the DNA of your music taste.',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppTheme.textMuted,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 120), // Bottom spacing
              ],
            ),
          ),
        ),
      ],
    );
  }
}
