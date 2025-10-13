import * as vscode from 'vscode';
import { ContextManager } from './contextManager';
import { CommandHandler } from './commandHandler';

export async function activate(context: vscode.ExtensionContext) {
	console.log('Open on GitHub extension is activating...');

	// Initialize context manager to detect GitHub repositories
	await ContextManager.initialize();

	// Register the main commands
	const openFileCommand = vscode.commands.registerCommand(
		'vscode-octo-link.openFileOnGitHub',
		CommandHandler.openFileOnGitHub
	);

	const openFileHistoryCommand = vscode.commands.registerCommand(
		'vscode-octo-link.openFileHistoryOnGitHub',
		CommandHandler.openFileHistoryOnGitHub
	);

	const copyPermalinkCommand = vscode.commands.registerCommand(
		'vscode-octo-link.copyPermalinkToClipboard',
		CommandHandler.copyPermalinkToClipboard
	);
	
	const openRelatedPullRequestCommand = vscode.commands.registerCommand(
		'vscode-octo-link.openRelatedPullRequest',
		CommandHandler.openRelatedPullRequest
	);

	// Register workspace change listeners to update context
	const onDidChangeWorkspaceFolders = vscode.workspace.onDidChangeWorkspaceFolders(async () => {
		await ContextManager.refresh();
	});

	// Register file system watcher for .git directories to refresh context when git state changes
	const gitWatcher = vscode.workspace.createFileSystemWatcher('**/.git/**');
	const onGitChange = async () => {
		await ContextManager.refresh();
	};
	
	gitWatcher.onDidCreate(onGitChange);
	gitWatcher.onDidDelete(onGitChange);

	// Add all disposables to context
	context.subscriptions.push(
		openFileCommand,
		openFileHistoryCommand,
		copyPermalinkCommand,
        openRelatedPullRequestCommand,
		onDidChangeWorkspaceFolders,
		gitWatcher
	);

	console.log('Open on GitHub extension is now active!');
}

export function deactivate() {
	console.log('Open on GitHub extension is deactivating...');
}
