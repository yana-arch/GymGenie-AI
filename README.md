<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  <h1>GymGenie: Your AI-Powered Fitness Companion</h1>
  <p>
    A modern, responsive, and performant web application designed to help you track your workouts, manage your fitness journey, and get AI-powered insights.
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
- [📜 Available Scripts](#-available-scripts)
- [🏗️ Building for Production](#-building-for-production)
- [🧪 Running Tests](#-running-tests)
- [🤝 Contributing](#-contributing)

---

## ✨ Features

- **AI-Powered Workouts**: Integrated with Gemini AI to provide intelligent workout suggestions.
- **Responsive Design**: Seamless experience across all devices, from mobile to desktop.
- **Performance Optimized**: Built with performance in mind, featuring virtualization for long lists and optimized components.
- **Session Management**: Robust session tracking with conflict detection and persistence.
- **Offline Support**: Continue using the app even without an internet connection, thanks to an offline request queue.
- **Rich User Interface**: Modern UI with features like workout history, exercise details, and progress calendars.

## 🛠️ Tech Stack

- **Frontend**: [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/), React Context
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Testing**: [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/)

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

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
    *Note: The `VITE_` prefix is required for environment variables to be exposed to the client-side code by Vite.*

### Running the Development Server

Once the installation is complete, you can start the local development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## 📜 Available Scripts

In the project directory, you can run the following commands:

- `npm run dev`: Runs the app in development mode.
- `npm run build`: Builds the app for production.
- `npm run lint`: Lints the codebase using ESLint.
- `npm run test`: Runs the test suite using Vitest.
- `npm run preview`: Serves the production build locally for preview.

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
