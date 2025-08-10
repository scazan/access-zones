# Contributing to rbac-zones

Thank you for your interest in contributing to rbac-zones! This document provides guidelines and information for contributors.

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/scazan/rbac-zones.git
cd rbac-zones
```

2. Install dependencies:
```bash
npm install
```

3. Run tests:
```bash
npm test
```

4. Build the project:
```bash
npm run build
```

## Development Workflow

1. **Fork** the repository
2. **Create** a feature branch from `main`
3. **Make** your changes
4. **Add** tests for new functionality
5. **Ensure** all tests pass
6. **Run** linting and fix any issues
7. **Submit** a pull request

## Code Style

- Use TypeScript for all new code
- Follow the existing code style (ESLint configuration)
- Add JSDoc comments for public APIs
- Use descriptive variable and function names
- Keep functions small and focused

## Testing

- Write tests for all new functionality
- Maintain 100% test coverage
- Use descriptive test names
- Test both success and error cases
- Include integration tests for complex workflows

## Pull Request Process

1. Update documentation if needed
2. Add entries to CHANGELOG.md
3. Ensure CI passes
4. Request review from maintainers
5. Address feedback promptly

## Reporting Issues

When reporting issues, please include:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node.js version, etc.)
- Minimal code example if applicable

## Feature Requests

For feature requests, please:

- Check if the feature already exists
- Explain the use case and benefits
- Provide examples of how it would be used
- Consider backward compatibility

## Code of Conduct

This project follows a standard code of conduct. Please be respectful and professional in all interactions.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
