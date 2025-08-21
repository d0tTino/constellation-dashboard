# Constellation Dashboard

Constellation Dashboard is a Next.js application that stitches together various panels into a single web UI. Each panel can expose its own React component and the dashboard dynamically loads them.

## Installation

1. Clone the repository.
2. Run `npm install` to install dependencies.

## Running the Development Server

Start the local dev server with:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Linting and Testing

- Run `npm run lint` to check code style.
- Run `npm run test` to execute unit tests with Vitest.

## Greet CLI Command

Use the `greet` command to print a greeting message.

```bash
npm run greet
```

By default, this prints `Hello, Constellation!`. Supply a custom message with the `--message` flag:

```bash
npm run greet -- --message "Hi there!"
```

## Environment Variables

- `NEXT_PUBLIC_WS_URL` &ndash; WebSocket server URL used by the dashboard. Defaults to `ws://localhost:3001` if not provided.

## Adding New Panels

1. Create a React component in `app/panels/`.
2. Register it in `lib/panels.ts` by adding an entry to the registry with an `id`, `title`, and module path.
3. Restart the dev server to see it in the dashboard.

