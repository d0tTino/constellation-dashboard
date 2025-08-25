// Vitest setup file
// Tell React that the testing environment supports `act`.
// Without this, React 19 warns that "The current testing environment is not configured to support act(...)".
// Setting this global enables React's built-in act behavior in our tests.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
