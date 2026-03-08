# Contributing to Taion Expression

Thanks for your interest in contributing!

## Getting Started

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`

## Development Workflow

- `npm run build` -- compile TypeScript (CJS + ESM)
- `npm run test:unit` -- run Jest tests
- `npm run test:lint` -- check lint rules
- `npm run test:prettier` -- check formatting
- `npm run fix:lint` -- auto-fix lint issues
- `npm run fix:prettier` -- auto-fix formatting

## Code Style

- Single quotes for strings
- Strict TypeScript with strong typing
- Functional style -- prefer pure functions, avoid mutable state
- Sort imports alphabetically with newlines between groups
- JSDoc comments on exported functions and classes

## Submitting Changes

1. Create a feature branch from `main`
2. Make your changes with clear, focused commits
3. Ensure all checks pass: `npm test`
4. Open a pull request against `main`
