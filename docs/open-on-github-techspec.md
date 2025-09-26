## Technical Specification: Open on GitHub (Explorer Context Menu)

Derived from: `open-on-github-prd.md`
Status: Draft (v0.1)
Owner: Software Architecture
Last Updated: 2025-09-27

---

### 1. Overview
Provide a context menu action in the VS Code Explorer that opens the selected file's corresponding location on GitHub for the *current* branch (or commit) in the user's default browser. The command only appears when the workspace folder is a Git repository whose primary remote host is GitHub and the selected resource is a tracked file.

### 2. Goals
- Minimize user friction: 1 right‑click → open in browser.
- Correctness of URL for branch/ref and path.
- Fast (no blocking long git operations).
- Safe fallback behaviors when preconditions not met.

### 3. Non-Goals
- Not supporting non-GitHub hosts (GitLab, Bitbucket, etc.) in initial version.
- Not adding line highlighting (may come later).
- Not opening directories (only files in v1).
- Not supporting multiple remotes selection (uses priority rules—see below).

### 4. Functional Requirements Mapping (from PRD)
| PRD Requirement | Tech Interpretation |
|-----------------|---------------------|
| Context menu item only in GitHub repo | Use `when` clause with a custom context key set at activation after remote detection. |
| Opens file in browser for current branch | Resolve current `HEAD` symbolic ref; if detached, use commit SHA. |
| Uses current branch not default | Derive `git rev-parse --abbrev-ref HEAD`; fallback to SHA. |
| Works for any tracked file | Confirm file path appears in `git ls-files`; skip if untracked. |
| Hidden if remote not GitHub | Hostname parsing of `origin` (or highest priority remote). |
| Hidden if file not tracked | Pre-check via git index; show error toast when invoked (edge race). |
| Documented in README | Add section with description and limitations. |

### 5. User Experience
Interaction Flow:
1. User right-clicks a file node in Explorer.
2. Context menu shows "Open on GitHub" (only if eligibility checks passed at contribution-level + dynamic gating).
3. On selection: quick status message (optional) → Browser opens to GitHub URL.
4. If failure (e.g., no remote): show error notification with actionable hint.

Visual Labels:
- Command Title: "Open on GitHub".
- No icon v1 (optionally add GitHub octocat later via codicon if licensing compatible or generic link icon).

### 6. Data & Inputs
- Selected file URI (VS Code Explorer passes via context). Use `fsPath` for local normalization.
- Git repository root path (resolve via VS Code Git extension API or fallback to shell execution).
- Remotes list (parse for GitHub remotes: patterns for `github.com` or enterprise host detection if `.git/config` host ends with a GitHub-known domain—future extension potential).
- Current branch or commit SHA.

### 7. Remote Resolution Algorithm
Priority Order:
1. Remote named `origin` if it matches GitHub host pattern.
2. First remote with GitHub host.
3. If none → feature disabled.

Supported Remote URL Formats:
- SSH: `git@github.com:ORG/REPO.git`
- HTTPS: `https://github.com/ORG/REPO.git`
- Enterprise (future): pattern `https://<host>/ORG/REPO(.git)`.

Normalization Steps:
1. Strip scheme / user / port.
2. Extract `owner` and `repo` (remove trailing `.git`).
3. Build base: `https://github.com/{owner}/{repo}` (enterprise: preserve host).

### 8. Branch / Ref Resolution
1. Attempt symbolic branch name (non `HEAD` from `git rev-parse --abbrev-ref HEAD`).
2. If result is `HEAD` (detached) → get full SHA `git rev-parse HEAD` and use `blob/{SHA}` rather than `blob/{branch}` to ensure stable content.
3. URL Pattern:
   - Branch: `.../blob/{branch}/{relativePath}`
   - Detached: `.../blob/{sha}/{relativePath}`

### 9. Relative Path Computation
Repository root + file path → compute relative using path separator normalization (convert Windows `\` to `/`).

### 10. File Tracked Check
Strategy (choose by performance):
1. Invoke `git ls-files --error-unmatch <relative>`; success => tracked.
2. Cache per-session positive results (Map) to reduce repeated calls for frequently used files.
3. Negative results not cached long (avoid stale due to staging operations) – TTL-based optional future enhancement.

### 11. Activation Strategy
Activation Triggers:
- Use `onStartupFinished` or `workspaceContains:.git` to ensure early availability.
Post-Activation:
- Scan workspace folders for top-level `.git` presence.
- For each: derive GitHub eligibility and set a context key: `openOnGithub.supported = true` if any folder qualifies.

### 12. VS Code Contributions
Commands:
- Identifier: `vscode-open-on-github.openFileOnGitHub`
Menus:
- `explorer/context`: show when: `openOnGithub.supported && resourceExtname != ''` (plus internal runtime filter for tracked state).

### 13. Internal Modules (Conceptual)
1. RepositoryResolver: identifies root, remotes, picks GitHub remote.
2. GitService: wraps git commands (exec abstraction, handles errors, timeouts, returns typed results).
3. UrlBuilder: given owner, repo, ref, relative path → returns full URL.
4. CommandHandler: orchestrates (input URI → validations → URL → open external).
5. ContextManager: sets VS Code context keys.
6. Diagnostics / Logger: minimal wrapper around `console` (future: adopt output channel).

### 14. Sequence (Happy Path)
User invokes command → CommandHandler:
1. Normalize file path.
2. Resolve repo root.
3. Validate remote (cached? else resolve).
4. Compute relative path.
5. Check tracked.
6. Resolve branch/ref.
7. Build URL.
8. Open external (default browser) via VS Code API.
9. (Optional) Show ephemeral status message.

### 15. Edge Cases
- Detached HEAD: use SHA.
- Submodules: treat file path relative to submodule root; still works if remote is GitHub (v1 does not aggregate parent).
- Multiple workspace folders: choose the one that contains the file path.
- File outside any Git repo root: command hidden or error if somehow invoked.
- Remote rename after activation: lazily re-resolve on miss; optional file watcher future improvement.
- Untracked file staged after initial negative: re-check each invocation (no persistent negative cache).
- Shallow clones: no impact (branch resolution still valid).

### 16. Error Handling & User Messaging
| Scenario | User Feedback | Action |
|----------|---------------|--------|
| No Git repo | Command not shown | None |
| Remote not GitHub | Command not shown | None |
| File untracked | Notification: "File is not tracked by Git." | Stop |
| Branch resolution failure | Notification: "Unable to determine current branch; using commit SHA." | Fallback to SHA |
| URL open failure | Error notification with retry suggestion | Log |
| Git command timeout | Notification with generic guidance | Retry once (optional) |

### 17. Performance Considerations
- Avoid running multiple sequential git commands when a combined retrieval suffices; cache remote + branch per repo (invalidate on timer or on explicit refresh request in future versions).
- Expected latency per invocation should remain <100ms after warm caching (excluding browser launch). Git operations kept minimal: typically 2 quick commands (branch, tracked check) after cache.

### 18. Security & Privacy
- No external network requests (browser open only). No tokens handled. Only local git metadata parsed.
- Enterprise host detection limited to domain parsing—no telemetry about domains (unless user consents in future).

### 19. Accessibility
- Command accessible via Command Palette (also register it) for keyboard-only usage.
- Provide clear command name; no reliance on iconography.

### 20. Internationalization (Future)
- v1: English only. Strings centralized for later extraction.

### 21. Logging / Telemetry (Deferred)
- v1: console debug only behind an internal flag (future setting: `openOnGithub.verboseLogging`). Not required now.

### 22. Testing Strategy
Test Types:
1. Unit (module-level) – mock git command executor.
2. Integration (using temporary git repo fixtures) – validate URL formation for various remote formats.
3. Behavioral (VS Code test harness) – ensure context menu presence and command execution path.

Key Test Cases:
- SSH remote standard.
- HTTPS remote standard.
- Detached HEAD.
- Untracked file error.
- File in nested folder.
- Multiple GitHub remotes (origin selected when valid).
- Non-GitHub remote (command absent).

### 23. Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Git extension not available | Could reimplement basic exec; still works | Use child process fallback |
| Large monorepos slow git ops | User perceives lag | Cache + async operations |
| Enterprise GitHub variance | URL mismatch | Add host derivation abstraction early |

### 24. Future Enhancements
- Open selection with line range highlighting (`#Lx-Ly`).
- Support directories (`/tree/`).
- Multi-remote selection if multiple GitHub origins.
- Copy URL to clipboard alternative command.
- Support other hosts (GitLab, Bitbucket) with pluggable strategy.

### 25. Assumptions
- Each targeted file belongs to exactly one git worktree root inside the workspace.
- User has at least one remote with push or fetch URL.
- Git binary available on PATH (fallback path configuration deferred).

### 26. Step-by-Step Implementation Guide
1. Add new command contribution + activation events in `package.json`.
2. On activation, detect at least one GitHub remote; set context key for gating menu.
3. Register command handler; accept resource URI parameter.
4. Implement repository resolution (map file to repo root) with caching map: file path → repo root.
5. Implement remote parsing + cache per repo: {owner, repo, hostBase}.
6. Implement branch/ref resolver with detachable fallback.
7. Implement tracked file check routine.
8. Implement URL builder.
9. Integrate: orchestrate sequence; open external URL; handle errors.
10. Update README: usage, limitations, examples (no screenshots required v1).
11. Add tests (unit first, then integration using temp directories + initializing mini git repos).
12. Manual QA on Windows (path separators), macOS/Linux if possible.
13. Version bump + changelog update.

### 27. Acceptance Criteria Traceability Matrix
| AC (PRD) | Section(s) Covering | Implementation Steps |
|----------|---------------------|----------------------|
| Context menu appears only in GitHub repo | 12, 11 | 1,2 |
| Opens file in browser at current branch | 8, 14 | 6,8,9 |
| URL uses current branch not default | 8 | 6 |
| Works for tracked files | 10 | 7 |
| Hidden if remote not GitHub | 7, 12 | 2 |
| Hidden if file not tracked | 10, 16 | 7,9 |
| Documented in README | 26 | 10 |

### 28. Open Questions (If Any Later)
- Should we show a quick pick if multiple GitHub remotes exist? (Deferred)
- Provide fallback if branch name contains slashes needing encoding? (Handled implicitly by URL encode; verify tests.)

---

### 29. Completion Definition (DoD)
- All acceptance criteria satisfied.
- All planned unit + integration tests pass in CI.
- README updated with feature section.
- No uncaught promise rejections in activation or command path during manual test.
- Lint passes with no new warnings of severity error.

---

End of document.
