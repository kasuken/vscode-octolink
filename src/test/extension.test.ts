import * as assert from 'assert';
import * as vscode from 'vscode';
import { GitService, GitRemote } from '../gitService';
import { UrlBuilder } from '../urlBuilder';
import * as path from 'path';

suite('Open on GitHub Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	suite('GitService Tests', () => {
		test('parseGitHubRemote - SSH format', () => {
			const result = (GitService as any).parseGitHubRemote('git@github.com:microsoft/vscode.git');
			assert.strictEqual(result?.owner, 'microsoft');
			assert.strictEqual(result?.repo, 'vscode');
		});

		test('parseGitHubRemote - HTTPS format', () => {
			const result = (GitService as any).parseGitHubRemote('https://github.com/microsoft/vscode.git');
			assert.strictEqual(result?.owner, 'microsoft');
			assert.strictEqual(result?.repo, 'vscode');
		});

		test('parseGitHubRemote - HTTPS without .git', () => {
			const result = (GitService as any).parseGitHubRemote('https://github.com/microsoft/vscode');
			assert.strictEqual(result?.owner, 'microsoft');
			assert.strictEqual(result?.repo, 'vscode');
		});

		test('parseGitHubRemote - non-GitHub URL', () => {
			const result = (GitService as any).parseGitHubRemote('https://gitlab.com/user/repo.git');
			assert.strictEqual(result, null);
		});

		test('getPreferredRemote - prefers origin', () => {
			const remotes: GitRemote[] = [
				{
					name: 'upstream',
					url: 'https://github.com/microsoft/vscode.git',
					owner: 'microsoft',
					repo: 'vscode',
					isGitHub: true
				},
				{
					name: 'origin',
					url: 'https://github.com/user/vscode.git',
					owner: 'user',
					repo: 'vscode',
					isGitHub: true
				}
			];
			
			const preferred = GitService.getPreferredRemote(remotes);
			assert.strictEqual(preferred?.name, 'origin');
			assert.strictEqual(preferred?.owner, 'user');
		});

		test('getPreferredRemote - fallback to first GitHub remote', () => {
			const remotes: GitRemote[] = [
				{
					name: 'upstream',
					url: 'https://github.com/microsoft/vscode.git',
					owner: 'microsoft',
					repo: 'vscode',
					isGitHub: true
				}
			];
			
			const preferred = GitService.getPreferredRemote(remotes);
			assert.strictEqual(preferred?.name, 'upstream');
			assert.strictEqual(preferred?.owner, 'microsoft');
		});
	});

	suite('UrlBuilder Tests', () => {
		const mockRemote: GitRemote = {
			name: 'origin',
			url: 'https://github.com/microsoft/vscode.git',
			owner: 'microsoft',
			repo: 'vscode',
			isGitHub: true
		};

		test('buildFileUrl - with branch', () => {
			const repoRoot = '/path/to/repo';
			const filePath = '/path/to/repo/src/extension.ts';
			const branch = 'main';
			const sha = 'abc123';

			const url = UrlBuilder.buildFileUrl(mockRemote, filePath, repoRoot, branch, sha);
			assert.strictEqual(url, 'https://github.com/microsoft/vscode/blob/main/src/extension.ts');
		});

		test('buildFileUrl - with SHA (detached HEAD)', () => {
			const repoRoot = '/path/to/repo';
			const filePath = '/path/to/repo/src/extension.ts';
			const branch = '';
			const sha = 'abc123def456';

			const url = UrlBuilder.buildFileUrl(mockRemote, filePath, repoRoot, branch, sha);
			assert.strictEqual(url, 'https://github.com/microsoft/vscode/blob/abc123def456/src/extension.ts');
		});

		test('buildFileUrl - nested file path', () => {
			const repoRoot = '/path/to/repo';
			const filePath = '/path/to/repo/src/test/extension.test.ts';
			const branch = 'feature/test';
			const sha = 'abc123';

			const url = UrlBuilder.buildFileUrl(mockRemote, filePath, repoRoot, branch, sha);
			assert.strictEqual(url, 'https://github.com/microsoft/vscode/blob/feature%2Ftest/src/test/extension.test.ts');
		});

		test('buildFileUrl - handles Windows paths', () => {
			const repoRoot = 'C:\\path\\to\\repo';
			const filePath = 'C:\\path\\to\\repo\\src\\extension.ts';
			const branch = 'main';
			const sha = 'abc123';

			const url = UrlBuilder.buildFileUrl(mockRemote, filePath, repoRoot, branch, sha);
			assert.strictEqual(url, 'https://github.com/microsoft/vscode/blob/main/src/extension.ts');
		});

		test('buildFileUrl - handles special characters in filename', () => {
			const repoRoot = '/path/to/repo';
			const filePath = '/path/to/repo/file with spaces & special chars.ts';
			const branch = 'main';
			const sha = 'abc123';

			const url = UrlBuilder.buildFileUrl(mockRemote, filePath, repoRoot, branch, sha);
			assert.strictEqual(url, 'https://github.com/microsoft/vscode/blob/main/file%20with%20spaces%20%26%20special%20chars.ts');
		});

		test('buildFileHistoryUrl - with branch', () => {
			const repoRoot = '/path/to/repo';
			const filePath = '/path/to/repo/src/extension.ts';
			const branch = 'main';
			const sha = 'abc123';

			const url = UrlBuilder.buildFileHistoryUrl(mockRemote, filePath, repoRoot, branch, sha);
			assert.strictEqual(url, 'https://github.com/microsoft/vscode/commits/main/src/extension.ts');
		});

		test('buildFileHistoryUrl - with SHA (detached HEAD)', () => {
			const repoRoot = '/path/to/repo';
			const filePath = '/path/to/repo/src/extension.ts';
			const branch = '';
			const sha = 'abc123def456';

			const url = UrlBuilder.buildFileHistoryUrl(mockRemote, filePath, repoRoot, branch, sha);
			assert.strictEqual(url, 'https://github.com/microsoft/vscode/commits/abc123def456/src/extension.ts');
		});

		test('buildFileHistoryUrl - nested file path', () => {
			const repoRoot = '/path/to/repo';
			const filePath = '/path/to/repo/src/test/extension.test.ts';
			const branch = 'feature/test';
			const sha = 'abc123';

			const url = UrlBuilder.buildFileHistoryUrl(mockRemote, filePath, repoRoot, branch, sha);
			assert.strictEqual(url, 'https://github.com/microsoft/vscode/commits/feature%2Ftest/src/test/extension.test.ts');
		});
	});
});
