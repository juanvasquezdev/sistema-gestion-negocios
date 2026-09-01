# Fast Inventory — AI Development Workflow

## ROLES

### Juan

Owner and decision maker.

Responsible for:

- understanding;
- decisions;
- testing;
- approving architecture;
- reviewing changes.

### ChatGPT

Senior mentor and reviewer.

Responsible for:

- architecture;
- debugging strategy;
- security;
- code review;
- business logic analysis;
- deployment planning;
- learning explanations.

### Cursor

Local implementation agent.

Responsible for:

- inspecting repository;
- editing files;
- running commands;
- implementing approved changes;
- validating implementation.

### Claude

Optional second opinion.

Use Claude when another independent analysis would add value.

Do not allow multiple AI agents to edit the same files simultaneously.

## GOLDEN LOOP

### 1. Define

One objective only.

### 2. Plan

Discuss with ChatGPT:

- architecture;
- affected files;
- risks;
- API;
- database;
- security.

### 3. Implement

Give Cursor a bounded task.

### 4. Inspect

Cursor must inspect existing code before editing.

### 5. Edit

Only required files.

### 6. Validate

Run:

- typecheck;
- lint;
- tests;
- runtime checks when relevant.

### 7. Review

Bring the diff, error, screenshot, or implementation back to ChatGPT.

### 8. Fix

Cursor applies the approved correction.

### 9. Commit

Create a small conventional commit.

### 10. Document

Update Obsidian only when durable knowledge changed.

## CURSOR PROMPT

Use:

You are working on Fast Inventory.

Objective:
[ONE OBJECTIVE]

Context:
[SHORT CONTEXT]

Constraints:
- Inspect existing implementation first.
- Reuse current patterns.
- Do not change unrelated files.
- Preserve authentication.
- Preserve authorization.
- Preserve tenant isolation.
- Preserve business rules.
- Do not add dependencies without approval.

Before editing:
Tell me which files you will inspect/change and why.

After editing:
- summarize files changed;
- explain important decisions;
- run relevant validation;
- report exact commands/results;
- list remaining uncertainty.

## DO NOT

Do not ask an AI:

"Build the entire ERP."

Do not ask:

"Refactor everything."

Do not let two agents edit the same code simultaneously.

Do not accept a huge diff without reviewing it.

Do not change database architecture just to solve an application error.

Do not install dependencies automatically without understanding why.

## DEFINITION OF DONE

A task is done when:

- expected behavior works;
- relevant validation passes;
- security is preserved;
- tenant isolation is preserved;
- no unrelated changes exist;
- Juan understands the important implementation;
- Git diff is reviewable;
- documentation is updated when necessary.