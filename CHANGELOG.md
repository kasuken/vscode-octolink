# Change Log

## [0.0.1] - 2025-09-27

### Added
- "Open on GitHub" context menu item in Explorer for GitHub repository files
- "Open File History on GitHub" context menu item to view commit history for specific files
- Command Palette support with "Open on GitHub" and "Open File History on GitHub" commands
- Automatic detection of GitHub repositories via remote URL parsing
- Current branch and commit SHA resolution for accurate GitHub URLs
- Support for both SSH (`git@github.com:owner/repo.git`) and HTTPS (`https://github.com/owner/repo.git`) remotes
- File tracking verification to ensure only committed files show the option
- Smart remote selection (prefers `origin`, falls back to first GitHub remote)
- Windows path normalization for cross-platform compatibility
- Comprehensive error handling and user feedback