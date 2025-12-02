# Contributing to Centy App

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Getting Started

1. **Fork the repository** and clone it locally
2. **Install dependencies**: `pnpm install`
3. **Create a branch** for your changes: `git checkout -b feature/your-feature-name`

## Development Workflow

### Prerequisites

- Node.js >= 20.0.0
- pnpm (latest version)
- Docker (for local container testing)

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

### Development Commands

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm test` - Run tests
- `pnpm test:coverage` - Run tests with coverage
- `pnpm lint` - Check code quality
- `pnpm lint:fix` - Fix linting issues
- `pnpm format` - Format code
- `pnpm format:check` - Check formatting
- `pnpm spell` - Check spelling
- `pnpm knip` - Find unused files, dependencies, and exports

### Docker Commands

```bash
# Build Docker image locally
docker build -t centy-app .

# Run container locally
docker run -p 3000:80 centy-app
```

## Making Changes

### Code Style

This project uses:

- **TypeScript** with strict mode
- **ESLint** with `eslint-config-agent` for linting
- **Prettier** for code formatting
- **cspell** for spell checking

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:

```
feat(ui): add dark mode toggle
fix(api): handle null response
docs(readme): update installation instructions
```

### Testing

- Write tests for all new features and bug fixes
- Ensure all tests pass: `pnpm test`
- Maintain or improve code coverage (80% minimum)
- Tests should be in `.spec.tsx` files next to their corresponding components

### Git Hooks

This project uses Husky for git hooks:

- **Pre-commit**: Runs lint-staged (lints, formats, and spell-checks staged files)
- **Commit-msg**: Validates commit message format using commitlint
- **Pre-push**: Runs full validation (lint, format, spell, knip, tests)

## Submitting Changes

### Pull Request Process

1. **Update your fork** with the latest changes from main
2. **Run all checks locally**:
   ```bash
   pnpm lint
   pnpm format:check
   pnpm spell
   pnpm knip
   pnpm test
   pnpm build
   ```
3. **Push your changes** and open a Pull Request
4. Fill out the PR template with:
   - Clear title describing the change
   - Description of what changed and why
   - Reference to any related issues

### Pull Request Guidelines

- Keep PRs focused on a single feature or fix
- Write clear, descriptive PR titles and descriptions
- Link related issues using "Fixes #123" or "Closes #123"
- Ensure CI passes (tests, linting, formatting)
- Respond to review feedback promptly

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

- **Description**: Clear description of the bug
- **Steps to reproduce**: Detailed steps to reproduce the issue
- **Expected behavior**: What you expected to happen
- **Actual behavior**: What actually happened
- **Environment**: Browser, OS, Node.js version
- **Screenshots**: If applicable

### Feature Requests

When requesting features, please include:

- **Use case**: Why is this feature needed?
- **Proposed solution**: How should it work?
- **Alternatives**: What alternatives have you considered?

## Questions?

- Check existing issues and discussions
- Read the documentation in README.md
- Open a new issue with the "question" label

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and beginners
- Focus on constructive feedback
- Assume good intentions

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

---

Thank you for contributing!
