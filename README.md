<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  <h1>GymGenie: Your AI-Powered Fitness Companion</h1>
  <p>
    A modern, responsive, and performant web application designed to help you track your workouts, manage your fitness journey, and get AI-powered insights. Now available as a native Android app!
  </p>
</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🛠️ Tech Stack](#-tech-stack)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Development Server](#running-the-development-server)
- [📱 Android Support](#-android-support)
- [📜 Available Scripts](#-available-scripts)
- [🏗️ Building for Production](#-building-for-production)
- [🧪 Running Tests](#-running-tests)
- [🤝 Contributing](#-contributing)

---

## ✨ Features

- **AI-Powered Workouts**: Integrated with Google Gemini AI to generate personalized workout plans based on your profile and equipment.
- **Smart Nutrition**: "Nutrition Genie" calculates your TDEE and generates meal plans/recipes using AI.
- **Live Workout Sessions**: Interactive session tracker with rest timers, set logging, and real-time progress updates.
- **Data Persistence**: Robust local storage using `redux-persist` ensures your data (profiles, plans, history) survives page refreshes and app restarts.
- **Responsive Design**: Seamless experience across all devices, from mobile phones to desktops.
- **Performance Optimized**: Built with Vite and React for lightning-fast load times and smooth interactions.
- **Offline Capable**: Core features work offline, syncing data when connectivity is restored.

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/), [Redux Persist](https://github.com/rt2zz/redux-persist), React Context
- **AI Integration**: [Google Gemini AI SDK](https://ai.google.dev/)
- **Mobile Runtime**: [Capacitor](https://capacitorjs.com/) (for Android APK generation)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) (Icons)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Testing**: [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/)

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- [Android Studio](https://developer.android.com/studio) (only if you plan to build the Android app)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/gymgenie-ai.git
    cd gymgenie-ai
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file:
    ```bash
    cp .env.example .env
    ```
    Now, open the `.env` file and add your Gemini API key:
    ```
    VITE_GEMINI_API_KEY=your_api_key_here
    ```
    _Note: The `VITE_` prefix is required for environment variables to be exposed to the client-side code by Vite._

### Running the Development Server

Once the installation is complete, you can start the local development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

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

## 🧪 Running Tests

This project uses Vitest for running unit and integration tests. To execute the test suite, run:

```bash
npm run test
```

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

For detailed information on our development process and contribution guidelines, please see our [**Development Usage Guide**](docs/DEVELOPMENT_USAGE.md).
