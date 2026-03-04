---
name: seed
description: Seed the todo database with dummy tasks and dependencies
allowed-tools: Bash(node scripts/seed.js *)
---

Ask the user the following two questions before running the seed script:

1. How many todo items would you like to generate? (1–100, default 12)
2. Should existing todos be cleared first? (yes/no)

Then run the seed script with the appropriate arguments:
- Use the count as the first argument
- Append `--clear` if the user said yes to clearing

Example commands:
- `node scripts/seed.js 15` — seed 15 todos, keep existing
- `node scripts/seed.js 20 --clear` — clear all and seed 20 todos

Report back what the script printed (number of todos created, number of dependencies, and the phase breakdown).
