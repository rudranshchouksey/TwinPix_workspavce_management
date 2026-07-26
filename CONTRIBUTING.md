# Contributing to TwinPix Workspace

We welcome contributions! Please follow these guidelines to ensure a smooth and consistent development process.

## Coding Standards

- **TypeScript**: Strict mode is enabled. Do not use `any` unless absolutely necessary. Define clear interfaces in `src/types`.
- **Styling**: Use Tailwind CSS for all styling. Avoid custom CSS unless utilizing global variables in `globals.css`.
- **Components**: Use `shadcn/ui` components located in `src/components/ui` as the foundation. Build complex features in `src/components/features`.
- **Data Fetching**: Prefer Next.js Server Actions over API Routes for internal mutations to optimize performance and typing.

## Folder Structure

Ensure your code is placed in the correct directory:
- `src/actions/`: Server Actions.
- `src/app/(dashboard)/`: Authenticated views.
- `src/components/ui/`: Generic, reusable UI atoms.
- `src/lib/`: Stateless utility functions.

## Branch Naming

Follow this convention for branch names:
- Feature: `feat/short-description`
- Bugfix: `fix/issue-description`
- Refactor: `refactor/what-was-changed`
- Documentation: `docs/what-was-updated`

## Commit Convention

We use Conventional Commits.
Example:
```
feat(campaigns): add budget tracking fields
fix(auth): resolve session timeout issue
docs(readme): update deployment instructions
```

## PR Guidelines

1. Ensure your branch is up to date with `main`.
2. Run `npm run lint` and resolve any errors before pushing.
3. Your PR title must follow the Commit Convention.
4. Provide a clear description of the problem solved and the approach taken.
5. Include screenshots if the PR involves UI changes.

## Testing

While full test coverage is a work in progress, ensure that:
1. Critical database mutations (Server Actions) handle errors gracefully.
2. UI components do not break the responsive layout.
3. Future automated tests will be placed in `__tests__` directories adjacent to the files they test.
