/**
 * Browser test runner. Serve the repo (npm run dev) and open
 * http://localhost:5173/tests/ — see index.html.
 *
 * Add a suite by importing its file below; each suite registers its tests
 * with the harness when imported.
 */

import { run } from "./harness.js";

import "./suite-component.js";

await run();
