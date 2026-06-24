# Contributing to TwinPix Workspace

First off, thank you for considering contributing to TwinPix Workspace! It's people like you that make open-source a great community to learn, inspire, and create.

This document outlines the process for contributing to the repository.

---

## 🚀 Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/twinpix-workspace.git
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up your environment**:
   Follow the setup instructions in the [README.md](./README.md) to configure your database and API keys.

---

## 🌱 Branch Naming Conventions

We follow a strict branching model to keep our repository organized. Please name your branches using the following formats:

- **Features**: `feat/short-description` (e.g., `feat/add-ai-scoring`)
- **Bug Fixes**: `fix/short-description` (e.g., `fix/campaign-card-overflow`)
- **Documentation**: `docs/short-description` (e.g., `docs/update-api-reference`)
- **Refactors**: `refactor/short-description` (e.g., `refactor/extract-table-component`)
- **Chores**: `chore/short-description` (e.g., `chore/update-dependencies`)

---

## 📝 Commit Conventions

We strictly adhere to [Conventional Commits](https://www.conventionalcommits.org/). This helps us automatically generate changelogs and version releases.

**Format:**
```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

**Examples:**
- `feat(influencer): add instagram engagement sync via apify`
- `fix(ui): resolve overflow issue on campaign board`
- `docs: update deployment troubleshooting guide`

---

## 🔁 Pull Request Guidelines

1. **Create a branch** from `main`.
2. Ensure your code strictly follows our **Code Style Rules**.
3. **Commit** your changes using Conventional Commits.
4. **Push** your branch to your fork.
5. Open a **Pull Request (PR)** against the `main` branch of the upstream repository.
6. **Description**: Clearly describe the problem you are solving and the approach you took. Reference any related issues (e.g., `Fixes #123`).
7. **Review**: Wait for a core maintainer to review your code. Be prepared to make requested changes.

---

## 💅 Code Style Rules

To ensure a consistent and readable codebase, we enforce the following rules:

- **TypeScript Strict Mode**: All code must be strongly typed. Avoid using `any` wherever possible.
- **Component Structure**: Follow the established pattern in `src/components`. Use Server Components by default, and `use client` only when necessary (e.g., for interactivity or hooks).
- **Styling**: We use **Tailwind CSS**. Avoid writing custom CSS unless absolutely necessary. Rely on utility classes and our global CSS variables for colors (e.g., `var(--color-brand-500)`).
- **Linting**: Ensure your code passes all linting checks. Run `npm run lint` before committing.
- **Server Actions**: All database mutations must go through Server Actions located in `src/actions`, rather than direct API routes, ensuring type safety from client to database.

*(For detailed architectural guidelines, see [CODE_STYLE.md](./CODE_STYLE.md))*

---

## 🧪 Testing Requirements

*(Note: Test suite implementation is currently in progress).*

As we introduce testing frameworks (Jest/Playwright), all new features must include:
1. **Unit Tests**: For utility functions and complex React hooks.
2. **Integration Tests**: For crucial Server Actions ensuring database integrity.
3. If your PR introduces a bug fix, include a test that would have failed without your fix.

Thank you for contributing to TwinPix Workspace!
