# Antidote v2 - Music Playlist Analytics Platform
## Product Specification for React Native Development

### 🎯 Project Overview

Antidote v2 is a sophisticated music playlist analytics platform that analyzes music playlists from multiple streaming platforms using advanced audio feature analysis, AI-powered recommendations, and beautiful data visualizations. The app provides deep insights into music taste, playlist health metrics, and intelligent recommendations.

**Target Platforms**: iOS, Android
**Primary Users**: Music enthusiasts, playlist curators, content creators
**Key Value Proposition**: "Discover the DNA of your music taste"

---

## ✨ Core Features

### 1. Multi-Platform Playlist Analysis
- **Supported Platforms**: Spotify, Apple Music, YouTube Music, SoundCloud
- **Audio Feature Analysis**: 8-dimensional analysis (energy, valence, danceability, tempo, acousticness, speechiness, instrumentalness, liveness)
- **Genre Intelligence**: Advanced genre detection and subgenre classification using Spotify's genre taxonomy
- **Artist Insights**: Top artists, collaboration patterns, artist diversity metrics

### 2. Playlist Health Check (Instant Value Feature)
- **Energy Consistency**: Measures playlist flow and energy variation
- **Genre Clutter Score**: Analyzes genre diversity vs. focus
- **Replay Potential**: Predicts long-term playlist engagement
- **Overall Health Score**: 0-100 rating with actionable suggestions
- **No Authentication Required**: Instant value for anonymous users

### 3. AI-Powered Recommendation Engine
- **Cosine Similarity Algorithm**: 8-dimensional audio feature vector matching (35% weight)
- **Genre Alignment**: Main genre (95%), subgenre (85%), partial match (60%) scoring
- **Artist Alignment**: Top artist match (95%), collaborations (80%) scoring
- **Flavor Profile System**: Language detection, genre hierarchy, vibe categorization
- **Multi-Strategy Search**: 10 different search strategies for diverse recommendations
- **Smart Filtering**: Removes remixes, acoustic versions, duplicates using 23+ patterns

### 4. Playlist Battle Mode
- **Head-to-Head Comparison**: Compare two playlists side-by-side
- **Compatibility Scoring**: Algorithmic determination of music taste compatibility
- **Energy Curve Visualization**: Interactive charts showing energy flow over time
- **Winner Determination**: Data-driven winner with detailed reasoning
- **Shared Analysis**: Common artists, genres, and audio feature comparisons

### 5. Advanced Analytics Dashboard
- **Mood Visualization**: Real-time mood distribution charts (Recharts)
- **Genre Breakdown**: Interactive genre hierarchy with main/subgenres
- **Popularity Distribution**: Track popularity analysis across ranges
- **Audio Feature Analysis**: Detailed breakdowns of all 8 audio dimensions
- **Temporal Insights**: Release date analysis and era distribution
- **Personality Insights**: AI-generated personality analysis based on music taste

### 6. User Management & Social Features
- **Authentication**: Email/password, OAuth (Spotify integration)
- **Saved Analyses**: Persistent storage of playlist analyses
- **Playlist History**: Track analysis history and trends
- **Profile System**: Music persona generation based on taste patterns
- **Sharing**: Share analyses and comparisons via deep links

---

## 🏗 Technical Architecture

### Frontend (React Native)
```
src/
├── components/
│   ├── ui/                    # Reusable UI components (shadcn/ui equivalent)
│   ├── analysis/             # Analysis result components
│   ├── comparison/           # Battle mode components
│   ├── recommendations/      # Recommendation components
│   ├── auth/                 # Authentication screens
│   └── shared/               # Shared components
├── screens/                  # Main app screens
│   ├── Home/                 # Landing screen with playlist input
│   ├── Analysis/             # Analysis results screen
│   ├── Compare/              # Battle mode screens
│   ├── Profile/              # User profile
│   └── Settings/             # App settings
├── navigation/               # Navigation configuration
├── services/                 # API services and external integrations
│   ├── api/                  # REST API client
│   ├── spotify/              # Spotify API integration
│   ├── storage/              # Local storage (AsyncStorage)
│   └── analytics/            # Analytics service
├── utils/                    # Utility functions
├── hooks/                    # Custom React hooks
├── constants/                # App constants and configuration
└── types/                    # TypeScript type definitions
```

### Backend Integration
- **API Base URL**: Environment-based configuration
- **Authentication**: JWT tokens with refresh logic
- **Rate Limiting**: Client-side rate limit handling
- **Error Handling**: Comprehensive error boundaries and retry logic
- **Offline Support**: Cache analysis results locally

### State Management
- **Local State**: React hooks (useState, useReducer)
- **Global State**: Context API for user session and app settings
- **Server State**: React Query for API data caching and synchronization
- **Persistent State**: AsyncStorage for user preferences and cached data

---

## 📡 API Integration

### Core Endpoints

#### `POST /api/analyze`
**Purpose**: Analyze a single playlist
**Request**:
```typescript
{
  url: string  // Playlist URL from supported platforms
}
```
**Response**:
```typescript
{
  success: boolean
  id?: string  // Database ID if authenticated
  analysis: {
    playlistName: string
    platform: string
    coverUrl?: string
    trackCount: number
    audioFeatures: AudioFeatures
    genres: GenreData[]
    artists: ArtistData[]
    mood: string
    personalityInsight: string
    overallRating: number
    flavorProfile: FlavorProfile
  }
}
```

#### `POST /api/health-check`
**Purpose**: Instant playlist health analysis
**Request**:
```typescript
{
  url: string
}
```
**Response**:
```typescript
{
  success: boolean
  health: PlaylistHealthMetrics
}
```

#### `POST /api/compare`
**Purpose**: Compare two playlists
**Request**:
```typescript
{
  url1: string
  url2: string
}
```
**Response**:
```typescript
{
  success: boolean
  id?: string
  comparison: ComparisonResult
}
```

#### `GET /api/recommendations`
**Purpose**: Get AI-powered recommendations
**Request**:
```typescript
{
  analysisId: string
  count?: number  // Default: 10
}
```
**Response**:
```typescript
{
  success: boolean
  tracks: RecommendedTrack[]
  baselineMetrics: object
}
```

### Authentication Endpoints
- `POST /auth/login`
- `POST /auth/signup`
- `POST /auth/logout`
- `GET /auth/session`

---

## 💾 Data Models

### Core Types

```typescript
interface AudioFeatures {
  energy: number        // 0-1: Intensity and activity
  valence: number       // 0-1: Musical positiveness
  danceability: number  // 0-1: Suitability for dancing
  tempo: number         // BPM
  acousticness: number  // 0-1: Acoustic vs electronic
  speechiness: number   // 0-1: Presence of spoken words
  instrumentalness: number // 0-1: Instrumental vs vocal
  liveness: number      // 0-1: Live performance likelihood
}

interface SpotifyTrack {
  id: string
  name: string
  artists: string[]
  album: string
  releaseDate: string
  durationMs: number
  popularity: number
  genres: string[]
  audioFeatures: AudioFeatures
  artistImageUrl?: string
}

interface DetailedAnalysisResult {
  // Basic Info
  trackCount: number
  artistCount: number
  albumCount: number

  // Mood & Personality
  playlistMood: string
  personalityInsight: string

  // Top Data
  topArtists: ArtistData[]
  topSubgenres: GenreData[]
  mainGenres: GenreData[]

  // Audio Features
  audioFeatures: AudioFeatures
  flavorProfile: FlavorProfile

  // Ratings
  overallRating: number  // 1-5 scale
  artistRating: number
  genreRating: number
  popularityRating: number
  lengthRating: number
}

interface PlaylistHealthMetrics {
  energyConsistency: {
    score: number  // 0-100
    level: "very_consistent" | "consistent" | "moderate" | "varied" | "very_varied"
  }
  genreClutterScore: {
    score: number  // 0-100
    level: "focused" | "balanced" | "diverse" | "cluttered" | "very_cluttered"
  }
  replayPotential: {
    score: number  // 0-100
    level: "very_low" | "low" | "moderate" | "high" | "very_high"
  }
  overallHealth: {
    score: number  // 0-100
    verdict: string
    suggestions: string[]
  }
}

interface ComparisonResult {
  playlist1: DetailedAnalysisResult & { playlistName: string; platform: string }
  playlist2: DetailedAnalysisResult & { playlistName: string; platform: string }
  sharedArtists: { name: string; imageUrl?: string }[]
  sharedGenres: string[]
  compatibilityScore: number  // 0-100
  compatibilityMessage: string
  winner: "playlist1" | "playlist2" | "tie"
  winnerReason: string
  audioFeatureComparison: {
    energy: { playlist1: number; playlist2: number; difference: number }
    valence: { playlist1: number; playlist2: number; difference: number }
    // ... other features
  }
}
```

---

## 🎨 UI/UX Design System

### Design Language
- **Theme**: Cosmic/dark theme with celestial background animations
- **Color Palette**:
  - Primary: Purple gradients (#7c3aed to #ec4899)
  - Secondary: Cyan accents (#06b6d4)
  - Background: Dark space theme (#0f0f23)
  - Text: Light colors with glow effects
- **Typography**: Monospace for inputs, sans-serif for content
- **Animations**: Framer Motion style micro-interactions

### Key Screens

#### 1. Home Screen
- **Hero Section**: Cosmic background with animated stars
- **Playlist Input**: Multi-platform URL input with platform detection
- **Quick Actions**: Health check button, battle mode link
- **Recent Analyses**: Horizontal scroll of recent results

#### 2. Analysis Results Screen
- **Header**: Playlist cover, name, platform badge
- **Health Score**: Circular progress indicator with verdict
- **Audio Features**: Radar chart visualization
- **Genre Breakdown**: Hierarchical genre display
- **Artist Grid**: Top artists with images
- **Personality Card**: AI-generated insight
- **Recommendations**: Swipeable recommendation cards

#### 3. Battle Mode Screen
- **Input Section**: Two playlist URL inputs
- **Compatibility Meter**: Animated compatibility score
- **Comparison Charts**: Side-by-side feature comparisons
- **Winner Announcement**: Animated winner reveal
- **Detailed Breakdown**: Tabbed analysis sections

#### 4. Profile Screen
- **User Stats**: Analysis count, favorite genres, music persona
- **History**: Timeline of analyses and comparisons
- **Settings**: Theme toggle, notification preferences

### Component Library
- **Charts**: Victory Native or react-native-chart-kit
- **Icons**: Lucide React (React Native compatible)
- **Forms**: React Hook Form with validation
- **Navigation**: React Navigation v6
- **Animations**: React Native Reanimated
- **Gestures**: React Native Gesture Handler

---

## 📱 Platform-Specific Considerations

### iOS Specific
- **Spotify Integration**: Use Spotify iOS SDK for deep linking
- **Haptic Feedback**: Use React Native Haptic Feedback for interactions
- **App Clips**: Quick analysis without full app install
- **Share Extension**: Allow playlist analysis from Safari/Spotify app

### Android Specific
- **Spotify Integration**: Use Spotify Android SDK
- **Material Design**: Follow Material 3 design principles
- **Adaptive Icons**: Provide adaptive icon assets
- **Notification Channels**: For analysis completion notifications

### Cross-Platform Features
- **Deep Linking**: Handle playlist URLs from external apps
- **Background Processing**: Continue analysis when app is backgrounded
- **Offline Mode**: Cache results and allow offline viewing
- **Push Notifications**: Analysis completion and recommendation alerts

---

## 📦 Dependencies & Libraries

### Core Dependencies
```json
{
  "react": "18.2.0",
  "react-native": "0.72.0",
  "react-navigation": "^6.1.0",
  "@react-navigation/native": "^6.1.0",
  "@react-navigation/stack": "^6.3.0",
  "@react-navigation/bottom-tabs": "^6.5.0",
  "react-native-vector-icons": "^10.0.0",
  "react-native-gesture-handler": "^2.12.0",
  "react-native-reanimated": "^3.3.0",
  "react-native-screens": "^3.24.0",
  "react-native-safe-area-context": "^4.6.0"
}
```

### UI & Styling
```json
{
  "react-native-paper": "^5.10.0",
  "@react-native-async-storage/async-storage": "^1.19.0",
  "react-native-linear-gradient": "^2.8.0",
  "react-native-svg": "^13.9.0",
  "react-native-chart-kit": "^6.12.0",
  "react-native-super-grid": "^5.0.0"
}
```

### API & Networking
```json
{
  "axios": "^1.4.0",
  "@tanstack/react-query": "^4.32.0",
  "react-native-config": "^1.5.0"
}
```

### Authentication
```json
{
  "@supabase/supabase-js": "^2.30.0",
  "@supabase/auth-ui-react": "^0.4.7",
  "@supabase/auth-ui-shared": "^0.1.8"
}
```

### Development Tools
```json
{
  "@react-native/eslint-config": "^0.72.0",
  "eslint": "^8.45.0",
  "typescript": "^5.1.0",
  "@types/react": "^18.2.0",
  "react-native-dotenv": "^3.4.0"
}
```

---

## 🔄 Development Roadmap

### Phase 1: Core Foundation (Weeks 1-4)
- [ ] Project setup with React Native CLI
- [ ] Navigation structure implementation
- [ ] Basic UI components and theming
- [ ] API client setup with error handling
- [ ] Authentication flow (Supabase)
- [ ] Home screen with playlist input

### Phase 2: Analysis Features (Weeks 5-8)
- [ ] Playlist analysis integration
- [ ] Health check feature
- [ ] Analysis results screen
- [ ] Audio features visualization
- [ ] Genre and artist displays
- [ ] Personality insights

### Phase 3: Advanced Features (Weeks 9-12)
- [ ] Battle mode implementation
- [ ] Comparison visualizations
- [ ] Recommendations engine
- [ ] Profile and history screens
- [ ] Offline support and caching

### Phase 4: Polish & Launch (Weeks 13-16)
- [ ] Performance optimization
- [ ] Platform-specific testing
- [ ] UI/UX refinements
- [ ] Beta testing and feedback
- [ ] App store submissions

---

## 🧪 Testing Strategy

### Unit Tests
- Component rendering and interactions
- Business logic functions (analysis algorithms)
- API service methods
- Utility functions

### Integration Tests
- API integration tests
- Navigation flow tests
- Authentication flow tests
- Offline functionality tests

### E2E Tests
- Complete user journeys (analysis flow)
- Cross-platform compatibility
- Performance benchmarks

### Testing Libraries
```json
{
  "@testing-library/react-native": "^12.1.0",
  "@testing-library/jest-native": "^5.4.0",
  "jest": "^29.6.0",
  "react-native-testing-library": "^6.0.0",
  "detox": "^20.11.0"
}
```

---

## 🚀 Deployment & Distribution

### Build Configuration
- **Bundle Identifier**: com.antidote.music (iOS), com.antidote.music (Android)
- **Version Management**: Semantic versioning with automated builds
- **Code Signing**: Fastlane integration for automated signing
- **Build Variants**: Development, Staging, Production

### App Store Optimization
- **Keywords**: music analysis, playlist analyzer, spotify analyzer, music insights
- **Screenshots**: 5-6 screenshots showcasing key features
- **Description**: Focus on AI-powered insights and multi-platform support
- **Privacy Policy**: Comprehensive policy covering data usage

### Analytics & Monitoring
- **Crash Reporting**: Sentry integration
- **Performance Monitoring**: Firebase Performance
- **User Analytics**: Mixpanel or Amplitude
- **A/B Testing**: Feature flag system for testing new features

---

## 🔒 Security Considerations

### Data Protection
- **API Key Security**: Environment-based configuration
- **Token Storage**: Secure storage for authentication tokens
- **Data Encryption**: Encrypt sensitive user data at rest
- **Certificate Pinning**: Prevent man-in-the-middle attacks

### Privacy Compliance
- **GDPR Compliance**: User data deletion and export features
- **Data Minimization**: Only collect necessary user data
- **Consent Management**: Clear user consent for data collection
- **Third-party Data**: Secure handling of Spotify API data

### Platform Security
- **iOS**: App Transport Security, Keychain integration
- **Android**: Network security config, biometric authentication
- **Code Obfuscation**: ProGuard/R8 configuration for release builds

---

## 📊 Success Metrics

### User Engagement
- **Daily Active Users**: Target 10,000 DAU in first 6 months
- **Session Duration**: Average 5+ minutes per session
