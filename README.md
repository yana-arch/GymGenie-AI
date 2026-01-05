<div align="center">
  <img width="1200" height="475" alt="GymGenie Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  <h1 align="center">🏋️‍♂️ GymGenie AI</h1>
  <p align="center">Your AI-Powered Fitness Companion</p>

  <p align="center">
    Transform your fitness journey with personalized AI-generated workout plans, smart nutrition tracking, and intelligent progress insights. Available as both a modern web application and native Android app.
  </p>
</div>

<div align="center">

[![React](https://img.shields.io/badge/React-19.0.0-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0.0-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4.1-646cff?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285f4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-6.0.0-119eff?style=for-the-badge&logo=capacitor)](https://capacitorjs.com/)

[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](CONTRIBUTING.md)
[![Build Status](https://img.shields.io/badge/Build-Passing-success?style=for-the-badge)](#)

</div>

---

## 📋 Table of Contents

- [📋 Table of Contents](#-table-of-contents)
- [✨ Overview](#-overview)
  - [🎯 What Makes GymGenie Special](#-what-makes-gymgenie-special)
- [🎯 Key Features](#-key-features)
  - [🤖 AI-Powered Intelligence](#-ai-powered-intelligence)
  - [🍎 Nutrition \& Recovery](#-nutrition--recovery)
  - [📊 Advanced Analytics](#-advanced-analytics)
  - [🔧 Technical Excellence](#-technical-excellence)
- [🖼️ Screenshots](#️-screenshots)
- [🏗️ Architecture](#️-architecture)
  - [System Design](#system-design)
  - [Core Components](#core-components)
- [🛠️ Technology Stack](#️-technology-stack)
- [🚀 Quick Start](#-quick-start)
  - [📋 Prerequisites](#-prerequisites)
  - [⚡ Installation](#-installation)
  - [🔧 Environment Configuration](#-environment-configuration)
  - [🏃‍♂️ Development Workflow](#️-development-workflow)
- [📱 Android Support](#-android-support)
  - [Generating the APK](#generating-the-apk)
- [📜 Available Scripts](#-available-scripts)
- [🏗️ Building for Production](#️-building-for-production)
- [🧪 Testing](#-testing)
  - [Running Tests](#running-tests)
  - [Test Structure](#test-structure)
  - [Testing Philosophy](#testing-philosophy)
- [📚 API Documentation](#-api-documentation)
  - [Google Gemini AI Integration](#google-gemini-ai-integration)
    - [Key Endpoints](#key-endpoints)
    - [Configuration](#configuration)
  - [Data Persistence](#data-persistence)
- [🤝 Contributing](#-contributing)
  - [🚀 Getting Started with Development](#-getting-started-with-development)
  - [📝 Development Guidelines](#-development-guidelines)
  - [🐛 Reporting Issues](#-reporting-issues)
  - [📖 Documentation](#-documentation)
- [📄 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)
  - [Core Technologies](#core-technologies)
  - [Community \& Inspiration](#community--inspiration)
  - [Special Thanks](#special-thanks)
- [📞 Support](#-support)
  - [💬 Getting Help](#-getting-help)
  - [🌟 Show Your Support](#-show-your-support)
  - [📈 Roadmap](#-roadmap)

---

## ✨ Overview

GymGenie AI is a comprehensive fitness companion that leverages cutting-edge AI technology to revolutionize your workout experience. Built with modern web technologies and designed for both web and mobile platforms, it offers personalized workout planning, intelligent nutrition guidance, and seamless progress tracking.

### 🎯 What Makes GymGenie Special

- **AI-First Approach**: Every feature is enhanced with Google Gemini AI for intelligent recommendations
- **Privacy-Focused**: All data stays on your device with optional cloud sync
- **Cross-Platform**: Works seamlessly on web browsers and as a native Android app
- **Performance-Driven**: Lightning-fast interactions with optimized React architecture

## 🎯 Key Features

### 🤖 AI-Powered Intelligence
- **Personalized Workout Plans**: AI analyzes your profile, goals, equipment, and fitness level to create optimal training programs
- **Smart Exercise Suggestions**: Intelligent exercise swaps and modifications based on available equipment and injury considerations
- **Adaptive Progress Tracking**: AI-powered insights into your performance trends and recommendations

### 🍎 Nutrition & Recovery
- **Nutrition Genie**: Calculates TDEE, BMR, and generates personalized meal plans with macro breakdowns
- **Recipe Generation**: AI creates healthy recipes from food photos using advanced image recognition
- **Recovery Optimization**: Intelligent rest period recommendations and workout scheduling

### 📊 Advanced Analytics
- **Live Session Tracking**: Real-time workout monitoring with set-by-set logging and progress visualization
- **Performance Metrics**: Comprehensive analytics including volume tracking, strength progression, and consistency scoring
- **Historical Insights**: Long-term progress analysis with trend identification and goal achievement tracking

### 🔧 Technical Excellence
- **Offline-First Architecture**: Core functionality works without internet connectivity
- **Data Persistence**: Robust local storage ensures your data is never lost
- **Responsive Design**: Pixel-perfect experience across all device sizes
- **Performance Optimized**: Sub-second load times and smooth 60fps interactions

## 🖼️ Screenshots

<div align="center">
  <table>
    <tr>
      <td align="center">
        <img src="https://via.placeholder.com/300x200/4f46e5/ffffff?text=Dashboard" alt="Dashboard" width="300"/><br/>
        <sub><b>Main Dashboard</b></sub>
      </td>
      <td align="center">
        <img src="https://via.placeholder.com/300x200/059669/ffffff?text=AI+Workout+Plan" alt="AI Workout Plan" width="300"/><br/>
        <sub><b>AI-Generated Workout Plans</b></sub>
      </td>
    </tr>
    <tr>
      <td align="center">
        <img src="https://via.placeholder.com/300x200/dc2626/ffffff?text=Live+Session" alt="Live Session" width="300"/><br/>
        <sub><b>Live Workout Tracking</b></sub>
      </td>
      <td align="center">
        <img src="https://via.placeholder.com/300x200/7c3aed/ffffff?text=Nutrition+Genie" alt="Nutrition Genie" width="300"/><br/>
        <sub><b>Nutrition Intelligence</b></sub>
      </td>
    </tr>
  </table>
</div>

## 🏗️ Architecture

### System Design

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   Capacitor     │    │   Android App   │
│   (Web)         │◄──►│   Runtime       │◄──►│   (Native)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Redux Store    │    │ Local Storage   │    │   SQLite DB     │
│  (State)        │◄──►│ (Persistence)   │    │ (Android)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Google Gemini   │    │   Exercise DB   │    │  Analytics      │
│ AI Service      │    │   (IndexedDB)   │    │  Engine         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Components

- **Feature-Driven Architecture**: Organized by business domains (workout, profile, nutrition, onboarding)
- **Service Layer**: Centralized business logic with AI integration
- **State Management**: Redux for global state, Context for component-specific state
- **Data Layer**: IndexedDB for exercises, LocalStorage for user preferences
- **Mobile Bridge**: Capacitor provides native device access

## 🛠️ Technology Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/), [Redux Persist](https://github.com/rt2zz/redux-persist), React Context
- **AI Integration**: [Google Gemini AI SDK](https://ai.google.dev/)
- **Mobile Runtime**: [Capacitor](https://capacitorjs.com/) (for Android APK generation)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) (Icons)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Testing**: [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/)

## 🚀 Quick Start

Get up and running in under 5 minutes! Follow these steps to start your fitness journey.

### 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **[Node.js](https://nodejs.org/)** (v18.x or later recommended)
- **[npm](https://www.npmjs.com/)** (comes with Node.js)
- **[Git](https://git-scm.com/)** (for cloning the repository)
- **[Android Studio](https://developer.android.com/studio)** (optional, for Android app development)

### ⚡ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/gymgenie-ai.git
   cd gymgenie-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Google Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` to see GymGenie AI in action!

### 🔧 Environment Configuration

The application requires a Google Gemini API key for AI-powered features. Get your free API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

**Environment Variables:**
- `VITE_GEMINI_API_KEY`: Your Google Gemini API key (required for AI features)
- `VITE_APP_ENV`: Environment mode (`development` or `production`)

### 🏃‍♂️ Development Workflow

```bash
# Start development server with hot reload
npm run dev

# Run tests
npm run test

# Lint code
npm run lint

# Build for production
npm run build
```

## 📱 Android Support

This project uses **Capacitor** to bundle the web application into a native Android APK.

### Generating the APK

1.  **Build the web assets:**

    ```bash
    npm run build
    ```

2.  **Sync with Capacitor:**

    ```bash
    npx cap sync
    ```

3.  **Open in Android Studio:**

    ```bash
    npx cap open android
    ```

4.  **Build within Android Studio:**
    - Wait for Gradle sync to complete.
    - Go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
    - The APK will be generated in `android/app/build/outputs/apk/debug/`.

## 📜 Available Scripts

In the project directory, you can run the following commands:

- `npm run dev`: Runs the app in development mode.
- `npm run build`: Builds the app for production (required before Capacitor sync).
- `npx cap sync`: Copies built web assets to the Android platform project.
- `npm run lint`: Lints the codebase using ESLint.
- `npm run test`: Runs the test suite using Vitest.

## 🏗️ Building for Production

To create a production-ready build of the application, run:

```bash
npm run build
```

This command will bundle the application into the `dist/` directory. The output is minified and optimized for the best performance.

## 🧪 Testing

This project maintains high code quality through comprehensive testing strategies.

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test -- --coverage

# Run specific test file
npm run test EquipmentScanner.test.tsx
```

### Test Structure

```
test/
├── setup.ts                    # Test configuration
├── test-utils.tsx             # Testing utilities
├── EquipmentScanner.test.tsx  # Component tests
├── LiveWorkoutSession.test.tsx # Integration tests
├── data-integrity.test.ts     # Data validation tests
├── performance-optimization.test.tsx # Performance tests
└── responsive-*.test.tsx      # Responsive design tests
```

### Testing Philosophy

- **Component Testing**: Unit tests for React components using React Testing Library
- **Integration Testing**: End-to-end workflows and API integrations
- **Performance Testing**: Bundle size and runtime performance validation
- **Data Integrity**: Ensures data persistence and validation across app restarts

## 📚 API Documentation

### Google Gemini AI Integration

The application integrates with Google Gemini AI for intelligent features:

#### Key Endpoints

- **Workout Generation**: `generateWorkoutPlan(userProfile, equipment)`
- **Recipe Analysis**: `generateRecipes(image, userProfile)`
- **Exercise Identification**: `identifyEquipment(image)`
- **Session Analysis**: `analyzeWorkoutSession(metrics)`

#### Configuration

```typescript
interface AiProviderConfig {
  provider: 'google';
  apiKey: string;
  useCustomUrl: boolean;
  customUrl?: string;
  model: string;
}
```

### Data Persistence

- **LocalStorage**: User preferences, AI configuration, app state
- **IndexedDB**: Exercise database, workout history, analytics data
- **Redux Persist**: Automatic state synchronization across sessions

## 🤝 Contributing

We welcome contributions from developers of all skill levels! Whether you're fixing bugs, adding features, or improving documentation, your input is valuable.

### 🚀 Getting Started with Development

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a feature branch**: `git checkout -b feature/amazing-feature`
4. **Make your changes** and ensure tests pass
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to your branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request** on GitHub

### 📝 Development Guidelines

- **Code Style**: Follow the existing TypeScript/React patterns
- **Testing**: Add tests for new features and bug fixes
- **Documentation**: Update README and docs for significant changes
- **Commits**: Use conventional commit format
- **PRs**: Provide clear descriptions and link related issues

### 🐛 Reporting Issues

Found a bug? Have a feature request? Please [open an issue](https://github.com/your-username/gymgenie-ai/issues) with:

- Clear title and description
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details

### 📖 Documentation

For detailed development information, see:
- [**Development Usage Guide**](docs/DEVELOPMENT_USAGE.md)
- [**Implementation Summary**](docs/IMPLEMENTATION_SUMMARY.md)
- [**Maintenance Guide**](docs/MAINTENANCE_GUIDE.md)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 GymGenie AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

### Core Technologies
- **React 19** - For the modern, performant user interface
- **Google Gemini AI** - For intelligent workout and nutrition recommendations
- **Capacitor** - For seamless cross-platform mobile development
- **Vite** - For lightning-fast development and building

### Community & Inspiration
- **Open Source Community** - For the incredible tools and libraries
- **Fitness Enthusiasts** - For inspiration and real-world use cases
- **Contributors** - For their time and expertise in making GymGenie better

### Special Thanks
- **Google AI** for providing access to cutting-edge AI capabilities
- **React Team** for the excellent developer experience
- **All Beta Testers** for valuable feedback and bug reports

## 📞 Support

### 💬 Getting Help

- **📖 Documentation**: Check our [docs](docs/) for detailed guides
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/your-username/gymgenie-ai/issues)
- **💡 Feature Requests**: [GitHub Discussions](https://github.com/your-username/gymgenie-ai/discussions)
- **📧 Email**: For business inquiries or partnerships

### 🌟 Show Your Support

If you find GymGenie AI helpful, please consider:

- ⭐ **Starring** the repository on GitHub
- 🐛 **Reporting bugs** or suggesting features
- 📢 **Sharing** with fellow fitness enthusiasts
- 🤝 **Contributing** code or documentation

### 📈 Roadmap

We're continuously improving GymGenie AI. Upcoming features include:

- **iOS Support** - Native iOS app via Capacitor
- **Advanced Analytics** - More detailed performance insights
- **Social Features** - Community workouts and challenges
- **Wearable Integration** - Direct smartwatch connectivity
- **Offline AI Models** - On-device AI processing

---

<div align="center">

**Made with ❤️ for the fitness community**

[⬆️ Back to Top](#-gymgenie-ai)

</div>
