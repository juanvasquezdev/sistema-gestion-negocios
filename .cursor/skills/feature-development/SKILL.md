---
name: feature-development
description: >-
  Runs Fast Inventory feature work as PLAN → IMPLEMENT → TEST → REVIEW → COMMIT.
  Use when adding or finishing a product feature, fixing a module, or when the
  user asks to implement, continue, or close a bounded dashboard/API task.
  Do not use for architecture redesign, Prisma schema redesign, or “build the
  whole ERP”.
---

# Feature development

Juan decides architecture. This skill is procedure only.
Invariants live in `.cursor/rules/`. Do not restate them here.

Read before coding: `00-project-core.mdc`.
Also read by area: `01-backend-nestjs.mdc`, `02-frontend-nextjs.mdc`,
`03-database-prisma.mdc`.
On review: `04-review.mdc`.
On durable knowledge: `05-documentation.mdc`.
Human/AI roles: `CURSOR-WORKFLOW.md` (do not copy that file into the reply).

One objective per run. Smallest coherent change. No unrelated refactors.
No new dependencies, migrations, or schema changes unless Juan approved them
in this conversation.

## PLAN

Before any edit:

1. Restate the single objective.
2. Inspect existing files (do not invent APIs, routes, types, or components).
3. List files to change and why.
4. List risks (auth, tenant, Decimal, transactions, API contract).
5. Stop if the task needs a schema/architecture decision Juan has not approved.

Output a short plan. Wait only if the user asked for a plan-only turn or
approval is missing. If they already said to implement that objective, proceed.

## IMPLEMENT

1. Inspect again in the files you will touch.
2. Edit only those files.
3. Reuse existing modules, DTOs, `frontend/src/lib/`, and UI components.
4. Do not weaken auth, roles, or `negocioId` scoping.

## TEST

Run the narrowest useful checks. Report exact commands and results.
Never claim it works if it was not run.

Backend (from `backend/`):

- `npm run lint` when TypeScript in `backend/src` changed
- `npm test` or a targeted Jest file when logic/API changed
- `npm run test:e2e` only if the change is an HTTP contract and e2e already covers it

Frontend (from `frontend/`):

- `npm run lint` when UI/lib/app code changed
- If UI behavior changed: verify in the browser (or say that browser tools were unavailable)

Do not install packages. Do not run Prisma migrate/reset unless Juan asked.

## REVIEW

Do not rewrite after coding. Summarize:

- files changed
- important decisions
- remaining uncertainty

If the user asked for a review, or the diff is security/tenant/money related,
apply `.cursor/rules/04-review.mdc` (severity + evidence). Do not paste that
template into this skill.

## COMMIT

Do not commit unless Juan explicitly asks.
When asked: conventional commit (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`),
one logical change, never `.env`/secrets/`node_modules`.

## DOCUMENT

Suggest an Obsidian update only if a durable decision changed.
Do not write docs for every line. Follow `05-documentation.mdc`.
