import * as vscode from 'vscode';
import { GitService } from './gitService';
import { UrlBuilder } from './urlBuilder';
import * as path from 'path';

export class CommandHandler {
    static async openFileOnGitHub(uri?: vscode.Uri): Promise<void> {
        try {
            // Get the file URI - either from parameter or active editor
            let fileUri: vscode.Uri | undefined = uri;
            
            if (!fileUri && vscode.window.activeTextEditor) {
                fileUri = vscode.window.activeTextEditor.document.uri;
            }

            if (!fileUri) {
                vscode.window.showErrorMessage('No file selected or active in editor.');
                return;
            }

            // Only support file scheme
            if (fileUri.scheme !== 'file') {
                vscode.window.showErrorMessage('This command only works with local files.');
                return;
            }

            const filePath = fileUri.fsPath;

            // Check if file exists
            try {
                await vscode.workspace.fs.stat(fileUri);
            } catch {
                vscode.window.showErrorMessage('Selected file does not exist.');
                return;
            }

            // Get git information
            const gitInfo = await GitService.getGitInfo(filePath);
            if (!gitInfo) {
                vscode.window.showErrorMessage('This file is not in a GitHub repository.');
                return;
            }

            // Check if file is tracked
            const isTracked = await GitService.isFileTracked(filePath, gitInfo.root);
            if (!isTracked) {
                vscode.window.showErrorMessage('File is not tracked by Git.');
                return;
            }

            // Get the preferred remote
            const remote = GitService.getPreferredRemote(gitInfo.remotes);
            if (!remote) {
                vscode.window.showErrorMessage('No GitHub remote found in this repository.');
                return;
            }

            // Determine ref to use
            const ref = gitInfo.currentBranch || gitInfo.currentSHA;
            if (!ref) {
                vscode.window.showErrorMessage('Unable to determine current branch or commit.');
                return;
            }

            // Build the URL
            const url = UrlBuilder.buildFileUrl(
                remote,
                filePath,
                gitInfo.root,
                gitInfo.currentBranch,
                gitInfo.currentSHA
            );

            // Open in browser
            const opened = await vscode.env.openExternal(vscode.Uri.parse(url));
            
            if (opened) {
                // Show brief success message
                const fileName = path.basename(filePath);
                vscode.window.setStatusBarMessage(
                    `Opened ${fileName} on GitHub`,
                    3000
                );
            } else {
                vscode.window.showErrorMessage('Failed to open URL in browser. Please try again.');
            }

        } catch (error) {
            console.error('Error in openFileOnGitHub:', error);
            vscode.window.showErrorMessage(
                `Failed to open file on GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    static async openFileHistoryOnGitHub(uri?: vscode.Uri): Promise<void> {
        try {
            // Get the file URI - either from parameter or active editor
            let fileUri: vscode.Uri | undefined = uri;
            
            if (!fileUri && vscode.window.activeTextEditor) {
                fileUri = vscode.window.activeTextEditor.document.uri;
            }

            if (!fileUri) {
                vscode.window.showErrorMessage('No file selected or active in editor.');
                return;
            }

            // Only support file scheme
            if (fileUri.scheme !== 'file') {
                vscode.window.showErrorMessage('This command only works with local files.');
                return;
            }

            const filePath = fileUri.fsPath;

            // Check if file exists
            try {
                await vscode.workspace.fs.stat(fileUri);
            } catch {
                vscode.window.showErrorMessage('Selected file does not exist.');
                return;
            }

            // Get git information
            const gitInfo = await GitService.getGitInfo(filePath);
            if (!gitInfo) {
                vscode.window.showErrorMessage('This file is not in a GitHub repository.');
                return;
            }

            // Check if file is tracked
            const isTracked = await GitService.isFileTracked(filePath, gitInfo.root);
            if (!isTracked) {
                vscode.window.showErrorMessage('File is not tracked by Git.');
                return;
            }

            // Get the preferred remote
            const remote = GitService.getPreferredRemote(gitInfo.remotes);
            if (!remote) {
                vscode.window.showErrorMessage('No GitHub remote found in this repository.');
                return;
            }

            // Determine ref to use
            const ref = gitInfo.currentBranch || gitInfo.currentSHA;
            if (!ref) {
                vscode.window.showErrorMessage('Unable to determine current branch or commit.');
                return;
            }

            // Build the history URL
            const url = UrlBuilder.buildFileHistoryUrl(
                remote,
                filePath,
                gitInfo.root,
                gitInfo.currentBranch,
                gitInfo.currentSHA
            );

            // Open in browser
            const opened = await vscode.env.openExternal(vscode.Uri.parse(url));
            
            if (opened) {
                // Show brief success message
                const fileName = path.basename(filePath);
                vscode.window.setStatusBarMessage(
                    `Opened ${fileName} history on GitHub`,
                    3000
                );
            } else {
                vscode.window.showErrorMessage('Failed to open URL in browser. Please try again.');
            }

        } catch (error) {
            console.error('Error in openFileHistoryOnGitHub:', error);
            vscode.window.showErrorMessage(
                `Failed to open file history on GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }
}
