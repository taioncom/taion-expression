# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Test Commands

- Build: `npm run build`
- Lint: `npm run test:lint`
- Format check: `npm run test:prettier`
- Fix formatting: `npm run fix:prettier`
- Fix linting issues: `npm run fix:lint`
- Run tests: `npm run test:unit`
- Run a single test: `npx jest tests/path/to/test.ts`

## Code Style Guidelines

- Use single quotes for strings
- Keep code immutable using readonly and const
- Create modular code and keep source files under 500 lines
- Follow the functional programming style (using plugin:functional/lite)
- Sort imports alphabetically with newlines between groups
- Explicit error handling with descriptive error messages
- Strict TypeScript usage with strong typing
- Each class/function should have JSDoc comments
- Prefer composition over inheritance
- Avoid mutable state
- All code should be pure functions without side effects
- Follow the existing naming conventions (camelCase for variables, PascalCase for types)

## Important

- Documentation uses Docusaurus and is in docsite folder
- Remember to update the documentation and readme when making changes
- Update also the docsite/docs/llms.md that contains compact reference for the LLMs
