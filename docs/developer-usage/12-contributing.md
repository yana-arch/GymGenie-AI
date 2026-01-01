# 12. Contributing

We welcome contributions to GymGenie! This document provides guidelines to ensure a smooth and effective development process.

## Branching Strategy

We use a simple branching strategy:

*   **`main`**: The `main` branch is the primary branch and should always be stable and deployable. Direct pushes to `main` are prohibited.
*   **Feature Branches**: All new work, whether it's a new feature, a bug fix, or a refactor, must be done on a feature branch.
    *   Branch names should be descriptive, using the format `feature/short-description` or `fix/bug-description`. For example: `feature/add-progress-chart` or `fix/session-conflict-modal`.
    *   Branches should be created from the `main` branch.

## Commit Guidelines

*   **Conventional Commits**: We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This creates a clear and understandable commit history.
    *   **Format**: `<type>[optional scope]: <description>`
    *   **Common Types**:
        *   `feat`: A new feature.
        *   `fix`: A bug fix.
        *   `docs`: Documentation only changes.
        *   `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc).
        *   `refactor`: A code change that neither fixes a bug nor adds a feature.
        *   `test`: Adding missing tests or correcting existing tests.
        *   `chore`: Changes to the build process or auxiliary tools.
    *   **Example**:
        ```
        feat(workout): add training volume chart to progress screen
        ```
        ```
        fix(session): resolve modal conflict on stale session
        ```

*   **Atomic Commits**: Make small, logical commits. A commit should represent a single, complete piece of work. Avoid large commits that do multiple things at once.

## Pull Request (PR) Process

1.  **Create a PR**: Once your work is complete and tested on your feature branch, open a Pull Request against the `main` branch.
2.  **PR Checklist**: The PR description should be clear and concise. It should include:
    *   A summary of the changes.
    *   A link to any relevant issue.
    *   Screenshots or GIFs for any UI changes.
    *   Confirmation that the PR has been tested locally.
3.  **Code Review**: At least one other developer must review and approve the PR. The reviewer should check for correctness, code style, and adherence to architectural principles.
4.  **Merge**: Once approved, the PR can be merged into `main`. Prefer "Squash and Merge" to keep the `main` branch history clean, with each merge corresponding to a single feature or fix.
