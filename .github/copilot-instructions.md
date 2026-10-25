
# API Integration Instructions

Before implementing or modifying frontend code that communicates with the backend:

- Read `docs/api/openapi.json` to understand the available API endpoints.
- Follow the documented HTTP methods, paths, parameters, request bodies, and response schemas.
- Do not invent API endpoints, response fields, or request formats.
- Reuse existing API clients and TypeScript types when available.
- If the OpenAPI specification does not describe the behavior needed, ask for clarification or identify the missing information instead of guessing.
- Keep the backend base URL in environment configuration rather than hardcoding it throughout the application.
