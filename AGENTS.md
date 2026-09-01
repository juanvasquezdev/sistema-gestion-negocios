# Fast Inventory — Agent Instructions

## Mission

Fast Inventory is a portfolio-grade multi-tenant business management SaaS.

The objective is to finish the product with:

- good architecture;
- security;
- maintainability;
- testing;
- deployment readiness;
- real understanding by the developer.

## Stack

Backend:
NestJS + Prisma 6.19.3 + PostgreSQL

Frontend:
Next.js 16 + App Router + TypeScript + Tailwind + shadcn/ui Base UI

Development:
Docker + PostgreSQL

## Development philosophy

Juan is learning by building.

AI should accelerate development, not replace understanding.

Inspect existing code before editing.

Prefer minimal changes.

Never invent project structure.

Never modify unrelated files.

Never change architecture without approval.

## Critical rules

Preserve:

- multi-tenancy;
- authentication;
- authorization;
- validation;
- Decimal precision;
- transaction integrity;
- existing business rules.

Tenant-owned queries must verify negocioId.

JWT roles are uppercase:

ADMIN
VENDEDOR

Prisma version:

6.19.3

## Workflow

PLAN
↓
INSPECT
↓
IMPLEMENT
↓
VALIDATE
↓
REVIEW
↓
COMMIT
↓
DOCUMENT

## Git

Use conventional commits:

feat:
fix:
refactor:
test:
docs:
chore:

Do not commit secrets.

## AI behavior

Before non-trivial changes:

- explain the plan;
- identify affected files;
- identify risks.

After changes:

- summarize modifications;
- explain important decisions;
- run relevant validation;
- report exact results;
- identify remaining uncertainty.