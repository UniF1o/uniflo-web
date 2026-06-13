// Regenerates lib/api/schema.d.ts from the uniflo-api OpenAPI spec.
// Set OPENAPI_SPEC_URL in your environment to point at a non-local spec.
import { execSync } from "node:child_process";

const url =
  process.env.OPENAPI_SPEC_URL ??
  "https://uniflo-api-c21u.onrender.com/openapi.json";

execSync(`npx openapi-typescript ${url} -o lib/api/schema.d.ts`, {
  stdio: "inherit",
});

// openapi-typescript emits single-line unions and its own indentation, which
// does not match the repo's Prettier style. schema.d.ts is not in
// .prettierignore, so an unformatted regen fails the CI format:check. Format it
// here so `npm run types:api` always leaves the tree CI-clean.
execSync(`npx prettier --write lib/api/schema.d.ts`, {
  stdio: "inherit",
});
