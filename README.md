# Centy App

A React application built with Vite and TypeScript, deployed as a Docker image to `tupe12334/centy`.

**[📚 Documentation](https://docs.centy.io)** | **[Report an Issue](https://github.com/tupe12334/centy-app/issues)**

## Prerequisites

- Node.js >= 20.0.0
- pnpm (latest version)
- Docker (for container builds)

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:5173 in your browser
```

## Available Scripts

| Command              | Description                    |
| -------------------- | ------------------------------ |
| `pnpm dev`           | Start development server       |
| `pnpm build`         | Build for production           |
| `pnpm preview`       | Preview production build       |
| `pnpm test`          | Run tests                      |
| `pnpm test:watch`    | Run tests in watch mode        |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm lint`          | Check code with ESLint         |
| `pnpm lint:fix`      | Fix ESLint issues              |
| `pnpm format`        | Format code with Prettier      |
| `pnpm format:check`  | Check code formatting          |
| `pnpm spell`         | Check spelling                 |
| `pnpm knip`          | Find unused code               |

## Docker

```bash
# Build Docker image
docker build -t centy-app .

# Run container
docker run -p 3000:80 centy-app

# Open http://localhost:3000 in your browser
```

## CI/CD

This project uses GitHub Actions for CI/CD:

- **On Pull Request**: Runs tests, linting, and build
- **On Push to Main**: Runs tests, then builds and pushes Docker image to `tupe12334/centy`

### Required Secrets

| Secret               | Description                     |
| -------------------- | ------------------------------- |
| `DOCKERHUB_USERNAME` | Docker Hub username             |
| `DOCKERHUB_TOKEN`    | Docker Hub access token         |
| `CODECOV_TOKEN`      | (Optional) Codecov upload token |

## Project Structure

```
src/
  App.tsx           # Main application component
  App.spec.tsx      # Tests for App component
  main.tsx          # Application entry point
  test/
    setup.ts        # Test setup (jest-dom matchers)
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT - see [LICENSE](LICENSE) for details.
