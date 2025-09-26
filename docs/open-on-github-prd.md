## Feature: Open on GitHub (Explorer Context Menu)

### Feature Summary
Enable users to right-click any file in the VS Code Explorer (when inside a GitHub repository) and open that file directly on the GitHub website, reflecting the current branch.

---

### User Stories

- **As a user,** when I am working in a GitHub repository in VS Code, I want to right-click a file in the Explorer and open it on GitHub, so I can quickly view or share the file as it appears in the current branch on GitHub.

---

### Acceptance Criteria

- The context menu item "Open on GitHub" appears when right-clicking a file in the Explorer, only if the workspace is a GitHub repository.
- Selecting "Open on GitHub" opens the file in the default browser at the corresponding URL for the current branch on GitHub.
- The URL reflects the current branch (not always the default branch).
- The feature works for any file tracked in the repository.
- If the repository remote is not GitHub, the menu item does not appear.
- If the file is not tracked by git, the menu item does not appear.
- The feature is discoverable and documented in the extension's README.