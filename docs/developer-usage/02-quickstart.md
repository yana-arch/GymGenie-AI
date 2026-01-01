# 2. Quickstart

This guide covers the setup and basic commands to get the GymGenie project running on your local machine.

## Prerequisites

*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [pnpm](https://pnpm.io/) (or `npm`/`yarn`)

The project uses `pnpm` for package management, but you can use `npm` or `yarn` if you prefer. The lock file is for `pnpm`.

## Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-repo/gymgenie.git
    cd gymgenie
    ```

2.  **Install dependencies:**

    Using pnpm:
    ```bash
    pnpm install
    ```

    Using npm:
    ```bash
    npm install
    ```

3.  **Environment Variables:**

    Create a `.env` file in the root of the project by copying the example file:

    ```bash
    cp .env.example .env
    ```

    Update the `.env` file with your local configuration, such as API keys for the `geminiService`.

    ```env
    VITE_GEMINI_API_KEY="YOUR_API_KEY_HERE"
    ```

## Available Scripts

The following scripts are available in [`package.json`](../../package.json:1) and can be run with `pnpm <script-name>` or `npm run <script-name>`.

*   **`dev`**: Starts the development server with Hot Module Replacement (HMR).
    ```bash
    pnpm dev
    ```
    The application will be available at `http://localhost:5173`.

*   **`build`**: Compiles and bundles the application for production.
    ```bash
    pnpm build
    ```
    The output is generated in the `dist/` directory.

*   **`lint`**: Lints the codebase using ESLint to check for code quality and style issues.
    ```bash
    pnpm lint
    ```

*   **`test`**: Runs the test suite using Vitest.
    ```bash
    pnpm test
    ```

*   **`test:ui`**: Runs the tests with the Vitest UI for a more interactive experience.
    ```bash
    pnpm test:ui
    ```
