# Project: Aurum HRMS
This is an Angular 21 HRMS / ERP application which uses tailwind for styling, and convex as the backend / db

## Code Style
- TypScript strict mode, no 'any' types
- CSS: Tailwind utility classes. CSS files may auto generate, but do not use them
- For small components, inline templates are preferred over separate template files
- `<class name>.spec.ts` is the naming convention for test files

## Commands
- `npm start`: Starts the angular development server (port 4200)
- `npx convex dev`: Starts the convex server. Necessary in tandem with the angular server
- `npm test`: Runs vitest tests
- `e2e`: Runs playwright tests

## Architecture

- `/convex`: Holds all the convex logic, types and all other related things
- `/src`: Contains all the angular code and assets
  - `/app`: Contains code
  - `/assets`: Where all icons and other assets are stored
  - `/environments`: Contains the environment files
- `/artifacts`: Untracked directory that contains artifacts from testing and regressions. Safe to clean up between runs
- `/scripts`: Contains some `.mjs` files that can be used to validate certain app logic and permissions. Not guaranteed to be up to date with changes
- `/public`: Contains the favicon.
- `/playwright-report`: Contains the results of the playwright test suite runs
- `/docs`: Holds temporary documentation or artifacts that are safe to clean up. Is not untracked, so be careful with it. If it is not present, it has simply been cleaned up between runs
- `.test-credentials`: Untracked file that contains all the test credentials on the dev server

### MD Files
While I'm trying to keep the project free of MD creep, here are some relevant ones

1. `AGENTS.md`: This file. True above all other sources of truth. Where any differences are noted, let this file be your guide.
2. `ROADMAP.md`: Contains the overall project progress and next steps. Refer to this if unsure.
3. `DESIGN LANGUAGE.md`: Contains the design language and ethos for the app, distilled from some design runs we did earlier. It is your Bible when it comes to design implementation. Never stray from it.
4. `ANGULAR BEST PRACTICES.md`: This contains some best practice guidelines for Angular, to avoid old patterns.
5. `CLAUDE.md`: OPTIONAL (not to be taken strictly), source of extra context and project history.
6. `README.md`: Default angular CLI generated README file

## Working agreements

- Practice TDD. Write your test cases for new components, methods or classes before writing the code. Write these tests based on the desired outcome. Make sure they pass before committing. All new code must be at 100% statement and branch coverage. This is especially true for component logic
- Use `npm` as your package manager
- Ask for confirmation before adding new deps
- For any commands that require elevated access, include a short description of what the command does in the approval request.
- Any and all changes to `AGENTS.md` must be explicitly approved by me first. Stop work to notify me and request permission before making edits to this file.
- ALWAYS refer to the design guidelines when creating new HTML / CSS.
- Keep commits atomic. Avoid thousand plus line diff commits. Break them up so progress is easy to follow, and reversion can be targeted as well
- Use your mcp tools where it makes sense to, and where time can be saved.
- You MUST adhere to best angular practices, and not outtdated ones.

## Tooling
You have access to these three mcps, and tools from them:
1. Codex mcp: Useful for querying the db when the codex server is running, and running codemods.
2. Playwright mcp: Crucial tool for running the app in a real browser. Use this to regression test where necessary
3. Angular mcp: Angular tool you can use to get best practices, find examples, and migrate to onpush zoneless. Use it where you need context on ng20+ best practices
