import * as vscode from 'vscode';
import { GitService } from './gitService';
import * as path from 'path';

export class ContextManager {
    private static isSupported = false;

    static async initialize(): Promise<void> {
        await this.updateGitHubSupport();
    }

    private static async updateGitHubSupport(): Promise<void> {
        let hasGitHubRepo = false;

        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            this.isSupported = false;
            await vscode.commands.executeCommand('setContext', 'openOnGithub.supported', false);
            return;
        }

        for (const folder of folders) {
            // Instead of checking .git path manually (could be a file with worktree), just attempt Git detection
            try {
                const gitInfo = await GitService.getGitInfo(folder.uri.fsPath);
                if (gitInfo && gitInfo.remotes.some(r => r.isGitHub)) {
                    hasGitHubRepo = true;
                    break;
                }
            } catch {
                // ignore and continue
            }
        }

        this.isSupported = hasGitHubRepo;
        await vscode.commands.executeCommand('setContext', 'openOnGithub.supported', hasGitHubRepo);
    }

    static async refresh(): Promise<void> {
        GitService.clearCache();
        await this.updateGitHubSupport();
    }

    static getSupported(): boolean {
        return this.isSupported;
    }
}
