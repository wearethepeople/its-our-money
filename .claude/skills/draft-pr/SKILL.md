---
name: draft-pr
description: Draft a pull request title and body by diffing the current branch against main. Triggers for: "draft a PR", "write PR title and body", "PR title", "create PR description", "help me write a PR", "what's a good PR title", "PR body", "open a pull request".
user-invocable: true
---

# Draft PR — It's Our Money

Diff the current branch against `main`, read all commits since divergence, and produce a ready-to-use PR title and body. **Output the draft for review — do not open the PR automatically.**

## Step 1 — Gather the diff

Run these in parallel:

```bash
git log main..HEAD --oneline
git diff main...HEAD --stat
git diff main...HEAD
```

Read the full diff. Don't skim — the title and summary must be accurate.

## Step 2 — Write the title

- **Current date**: [2026-mm-dd]
- **Imperative mood**, present tense: "Add X", "Fix Y", "Refactor Z"
- **≤ 70 characters**
- No ticket numbers, no emoji
- Describes the _user-facing change_, not the implementation detail

**Good:** `Add tax breakdown tab and improve juxtapose UX`  
**Bad:** `Updates to juxtapose route and AllocationService refactor`

## Step 3 — Write the body

Use this template:

```markdown
## Summary

- <bullet 1 — primary change>
- <bullet 2 — secondary change>
- <bullet 3 — if needed; omit if only 1–2 meaningful changes>

## Test plan

- [ ] `npm run typecheck` passes
- [ ] `npm run test -- --run` passes
- [ ] <specific manual check for the changed UI/route, e.g. "Visit /juxtapose — tax breakdown tab renders and math is correct">
- [ ] <any other manual check>
```

Keep bullets tight — one clause each. The summary describes _what changed and why_, not _how it was implemented_.

## Style notes (from this project's PR history)

- Summaries use plain prose bullets, not nested lists
- Test plan uses checkboxes
- No "This PR…" preamble — start bullets directly with the verb
- If the change touches the DB (new migration), call it out explicitly: "Adds migration for `weightBps` column rename"

## Output format

Present the title and body as a fenced code block each, ready to copy-paste:

````
**Title:**
```
Add X and improve Y
```

**Body:**
```markdown
## Summary
- ...

## Test plan
- [ ] ...
```
````

Then ask: _"Ready to open with `gh pr create`?"_ — only run `gh pr create` if the user confirms.

When running `gh pr create`, do **not** append any "Generated with Claude" footer or branding to the body.
