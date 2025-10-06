import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export interface GitRemote {
    name: string;
    url: string;
    owner: string;
    repo: string;
    isGitHub: boolean;
}

export interface GitInfo {
    root: string;
    remotes: GitRemote[];
    currentBranch: string;
    currentSHA: string;
}

export class GitService {
    private static repoCache = new Map<string, GitInfo>();
    private static trackedFileCache = new Map<string, boolean>();

    static async getGitInfo(filePath: string): Promise<GitInfo | null> {
        try {
            const repoRoot = await this.findGitRoot(filePath);
            if (!repoRoot) {
                return null;
            }

            // Check cache first
            const cached = this.repoCache.get(repoRoot);
            if (cached) {
                return cached;
            }

            // Get remotes
            const remotes = await this.getRemotes(repoRoot);
            if (!remotes.some(r => r.isGitHub)) {
                return null;
            }

            // Get current branch/SHA
            const { currentBranch, currentSHA } = await this.getCurrentRef(repoRoot);

            const gitInfo: GitInfo = {
                root: repoRoot,
                remotes,
                currentBranch,
                currentSHA
            };

            // Cache for future use
            this.repoCache.set(repoRoot, gitInfo);
            
            return gitInfo;
        } catch (error) {
            console.error('Error getting git info:', error);
            return null;
        }
    }

    static async isFileTracked(filePath: string, repoRoot: string): Promise<boolean> {
        // Check cache first
        const cached = this.trackedFileCache.get(filePath);
        if (cached !== undefined) {
            return cached;
        }

        try {
            const relativePath = path.relative(repoRoot, filePath).replace(/\\/g, '/');
            const { stderr } = await execAsync(`git ls-files --error-unmatch "${relativePath}"`, {
                cwd: repoRoot,
                timeout: 5000
            });
            
            const isTracked = !stderr;
            // Cache positive results
            if (isTracked) {
                this.trackedFileCache.set(filePath, true);
            }
            
            return isTracked;
        } catch (error) {
            return false;
        }
    }

    private static async findGitRoot(filePath: string): Promise<string | null> {
        // Support being passed either a file path OR a directory path. If it's a directory
        // we should attempt git commands from that directory rather than its parent.
        const tried = new Set<string>();
        const candidates: string[] = [];
        candidates.push(filePath);
        candidates.push(path.dirname(filePath));

        for (const candidate of candidates) {
            if (tried.has(candidate)) {
                continue;
            }
            tried.add(candidate);
            try {
                const { stdout } = await execAsync('git rev-parse --show-toplevel', {
                    cwd: candidate,
                    timeout: 5000
                });
                const root = stdout.trim();
                if (root) {
                    return root;
                }
            } catch {
                // try next candidate
            }
        }
        return null;
    }

    private static async getRemotes(repoRoot: string): Promise<GitRemote[]> {
        try {
            const { stdout } = await execAsync('git remote -v', {
                cwd: repoRoot,
                timeout: 5000
            });

            const remotes: GitRemote[] = [];
            const lines = stdout.trim().split('\n');
            const remoteMap = new Map<string, string>();

            // Parse remote output, prefer fetch URLs
            for (const line of lines) {
                const match = line.match(/^(\S+)\s+(\S+)\s+\((fetch|push)\)/);
                if (match) {
                    const [, name, url, type] = match;
                    if (type === 'fetch' || !remoteMap.has(name)) {
                        remoteMap.set(name, url);
                    }
                }
            }

            for (const [name, url] of remoteMap) {
                const parsed = this.parseGitHubRemote(url);
                if (parsed) {
                    remotes.push({
                        name,
                        url,
                        ...parsed,
                        isGitHub: true
                    });
                }
            }

            return remotes;
        } catch {
            return [];
        }
    }

    private static parseGitHubRemote(url: string): { owner: string; repo: string } | null {
        // SSH format: git@github.com:owner/repo.git
        let match = url.match(/git@github\.com:([^\/]+)\/([^\/]+?)(?:\.git)?$/);
        if (match) {
            return { owner: match[1], repo: match[2] };
        }

        // HTTPS format: https://github.com/owner/repo.git
        match = url.match(/https:\/\/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?\/?$/);
        if (match) {
            return { owner: match[1], repo: match[2] };
        }

        return null;
    }

    private static async getCurrentRef(repoRoot: string): Promise<{ currentBranch: string; currentSHA: string }> {
        try {
            // Get current branch name
            const { stdout: branchOutput } = await execAsync('git rev-parse --abbrev-ref HEAD', {
                cwd: repoRoot,
                timeout: 5000
            });
            
            const branchName = branchOutput.trim();
            
            // Get current commit SHA
            const { stdout: shaOutput } = await execAsync('git rev-parse HEAD', {
                cwd: repoRoot,
                timeout: 5000
            });
            
            const sha = shaOutput.trim();
            
            return {
                currentBranch: branchName === 'HEAD' ? '' : branchName,
                currentSHA: sha
            };
        } catch {
            return { currentBranch: '', currentSHA: '' };
        }
    }

    static clearCache(): void {
        this.repoCache.clear();
        this.trackedFileCache.clear();
    }

    static getPreferredRemote(remotes: GitRemote[]): GitRemote | null {
        // Priority: origin first, then any GitHub remote
        const origin = remotes.find(r => r.name === 'origin' && r.isGitHub);
        if (origin) {
            return origin;
        }
        
        const githubRemote = remotes.find(r => r.isGitHub);
        return githubRemote || null;
    }
}
