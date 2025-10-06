# Open on GitHub

A VS Code extension that allows you to quickly open files in your GitHub repository directly from the Explorer context menu.

## Features

- **Right-click context menu**: Right-click any file in the Explorer and select "Open on GitHub" to open it in your browser
- **File history access**: Right-click any file and select "Open File History on GitHub" to view the commit history for that specific file
- **Command Palette access**: Use `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) and search for "Open on GitHub" or "Open File History on GitHub"
- **Current branch support**: Opens the file at the current branch or commit (not always the default branch)
- **Smart detection**: Only appears for files in GitHub repositories that are tracked by Git
- **Multiple remote support**: Automatically selects the best remote (prefers `origin`)

## Usage

1. **Context Menu**: Right-click any file in the VS Code Explorer and select:
   - "Open on GitHub" - Opens the file content view
   - "Open File History on GitHub" - Opens the commit history for that file
2. **Command Palette**: Open the Command Palette (`Ctrl+Shift+P`) and run:
   - "Open on GitHub" - Opens the currently active file
   - "Open File History on GitHub" - Opens the history for the currently active file

The extension will:
- Detect if the file is in a GitHub repository
- Check if the file is tracked by Git
- Determine the current branch or commit SHA
- Open the file or its history in your default browser at the correct GitHub URL

## Limitations

- Only works with GitHub repositories (not GitLab, Bitbucket, etc.)
- Only works with tracked files (files that have been committed to Git)
- Only supports files, not directories
- Requires Git to be available on your system PATH

## Requirements

- Git must be installed and available on your system PATH
- Your project must be a Git repository with at least one GitHub remote
- Files must be tracked by Git (committed at least once)

## Extension Settings

This extension does not contribute any VS Code settings. It works automatically when the above requirements are met.

## Known Issues

- Branch names with special characters may require URL encoding (handled automatically)
- Large repositories may experience slight delays during git operations
- Submodules are treated relative to their own root, not the parent repository

## Release Notes

### 0.0.1

Initial release of Open on GitHub extension:

- Added "Open on GitHub" context menu item in Explorer
- Added Command Palette support
- Support for SSH and HTTPS GitHub remotes
- Automatic branch/commit detection
- File tracking verification

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
