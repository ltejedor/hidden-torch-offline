# Language Learning Offline Video App

A React Native/Expo mobile app for offline language learning with video lessons.

## Features

- **Lesson Library**: Browse through curated language learning lessons
- **Offline Downloads**: Download video lessons for offline viewing
- **Video Player**: Custom video player with transcript display
- **Download Manager**: Track download progress and manage cached content
- **Persistent Storage**: Lessons remain available after app restarts

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your mobile device, or Android/iOS simulator

### Installation

1. Clone and navigate to the project:
   ```bash
   cd hidden-torch-offline
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

4. Open the app:
   - **Android**: Press `a` to open in Android emulator
   - **iOS**: Press `i` to open in iOS simulator  
   - **Mobile**: Scan the QR code with Expo Go app

## Usage

1. **Browse Lessons**: View available language learning lessons on the home screen
2. **Download**: Tap "Download" to save a lesson for offline viewing
3. **Play**: Once downloaded, tap "Play" to watch the video with transcript
4. **Offline Mode**: Turn on airplane mode to verify offline functionality

## Tech Stack

- **Framework**: React Native with Expo SDK 53
- **Navigation**: React Navigation v7
- **Video**: expo-av for video playback
- **Storage**: AsyncStorage + FileSystem for offline downloads
- **TypeScript**: Full type safety throughout

## Project Structure

```
src/
├── types/           # TypeScript type definitions
├── data/            # Sample lesson data
├── screens/         # App screens (Home, Player, Downloads)
└── utils/           # Download manager and utilities
```

## Sample Lessons

The app includes 5 demo lessons:
- Basic Greetings
- Numbers 1-10
- Colors
- Days of the Week
- Common Phrases

## Testing Offline Mode

To verify offline functionality:
1. Download a lesson
2. Enable airplane mode on your device
3. The downloaded lesson should still play normally
