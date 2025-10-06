import * as path from 'path';
import { GitRemote } from './gitService';

export class UrlBuilder {
    static buildFileUrl(
        remote: GitRemote,
        filePath: string,
        repoRoot: string,
        branch: string,
        sha: string
    ): string {
        const relativePath = path.relative(repoRoot, filePath)
            .replace(/\\/g, '/'); // Normalize path separators for URLs
        
        const ref = branch || sha;
        const encodedRef = encodeURIComponent(ref);
        const encodedPath = relativePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
        
        return `https://github.com/${remote.owner}/${remote.repo}/blob/${encodedRef}/${encodedPath}`;
    }

    static buildFileHistoryUrl(
        remote: GitRemote,
        filePath: string,
        repoRoot: string,
        branch: string,
        sha: string
    ): string {
        const relativePath = path.relative(repoRoot, filePath)
            .replace(/\\/g, '/'); // Normalize path separators for URLs
        
        const ref = branch || sha;
        const encodedRef = encodeURIComponent(ref);
        const encodedPath = relativePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
        
        return `https://github.com/${remote.owner}/${remote.repo}/commits/${encodedRef}/${encodedPath}`;
    }
}
