# Contributing to Amani School System

Thank you for your interest in contributing to Amani School System! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

- Use the GitHub issue tracker
- Include detailed steps to reproduce the bug
- Include your environment details (OS, Node.js version, etc.)
- Include screenshots if applicable

### Suggesting Enhancements

- Use the GitHub issue tracker
- Clearly describe the enhancement
- Explain why this enhancement would be useful
- Include mockups or examples if applicable

### Pull Requests

- Fork the repository
- Create a feature branch from `main`
- Make your changes
- Add tests for new functionality
- Ensure all tests pass
- Submit a pull request

## Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/natasha709/amani.git
   cd amani
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

4. **Set up database**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the CHANGELOG.md with a note describing your changes
3. The PR will be merged once you have the sign-off of at least one maintainer

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode in tsconfig.json
- Use proper type annotations
- Avoid using `any` type

### React

- Use functional components with hooks
- Use TypeScript for all components
- Follow the component structure in the project
- Use Tailwind CSS for styling

### Backend

- Use Express.js for API routes
- Use Prisma for database operations
- Use Zod for validation
- Follow RESTful API conventions

### Code Style

- Use ESLint and Prettier for code formatting
- Follow the existing code style in the project
- Use meaningful variable and function names
- Add comments for complex logic

## Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Writing Tests

- Write unit tests for all new functionality
- Use Jest for backend tests
- Use Vitest for frontend tests
- Aim for at least 80% code coverage

## Reporting Bugs

When reporting bugs, please include:

1. **Summary**: A brief description of the bug
2. **Steps to Reproduce**: Detailed steps to reproduce the bug
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment**: OS, Node.js version, browser, etc.
6. **Screenshots**: If applicable

## Feature Requests

When requesting features, please include:

1. **Summary**: A brief description of the feature
2. **Use Case**: Why this feature would be useful
3. **Proposed Solution**: How you think this feature should work
4. **Alternatives**: Any alternative solutions you've considered

## Questions?

If you have any questions, please open an issue or contact the maintainers.

Thank you for contributing to Amani School System!
