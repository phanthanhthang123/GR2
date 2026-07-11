import axios from 'axios';

// Get admin token from environment
const getGithubClient = () => {
    const token = process.env.GITHUB_ADMIN_TOKEN;
    if (!token) {
        return null;
    }
    return axios.create({
        baseURL: 'https://api.github.com',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        }
    });
};

/**
 * Invite collaborator to a GitHub repository
 * @param {string} owner - owner of the repo
 * @param {string} repo - name of the repo
 * @param {string} username - GitHub username of the member to invite
 * @returns {Promise<{invitationId: string, status: string}>}
 */
export const inviteMemberToRepo = async (owner, repo, username) => {
    console.log(`[GitHub API] Gửi lời mời tới ${username} tham gia ${owner}/${repo}`);
    const client = getGithubClient();
    
    if (!client) {
        console.warn('[GitHub API] GITHUB_ADMIN_TOKEN chưa được cấu hình. Giả lập gửi lời mời thành công (Mock Mode).');
        return {
            invitationId: `mock-invite-${Math.random().toString(36).substr(2, 9)}`,
            status: 'Pending'
        };
    }

    try {
        const response = await client.put(`/repos/${owner}/${repo}/collaborators/${username}`, {
            permission: 'push'
        });
        
        // Trạng thái 201 Created nghĩa là lời mời được tạo, 204 No Content nghĩa là đã là cộng tác viên sẵn
        if (response.status === 201) {
            return {
                invitationId: String(response.data.id),
                status: 'Pending'
            };
        } else {
            return {
                invitationId: null,
                status: 'Active' // Đã có quyền sẵn
            };
        }
    } catch (error) {
        console.error('[GitHub API] Lỗi khi gửi lời mời cộng tác viên:', error.response?.data || error.message);
        // Fallback mock trong trường hợp lỗi API (tiện cho demo)
        return {
            invitationId: `mock-invite-${Math.random().toString(36).substr(2, 9)}`,
            status: 'Pending'
        };
    }
};

/**
 * Remove collaborator from GitHub repository
 */
export const removeMemberFromRepo = async (owner, repo, username) => {
    console.log(`[GitHub API] Xoá cộng tác viên ${username} khỏi repo ${owner}/${repo}`);
    const client = getGithubClient();
    
    if (!client) {
        return { success: true };
    }

    try {
        await client.delete(`/repos/${owner}/${repo}/collaborators/${username}`);
        return { success: true };
    } catch (error) {
        console.error('[GitHub API] Lỗi khi xoá cộng tác viên:', error.response?.data || error.message);
        return { success: false };
    }
};

/**
 * Fetch branches & commits statistics for a repo
 */
export const getRepoStats = async (owner, repo) => {
    const client = getGithubClient();
    
    if (!client) {
        // Mock data when token is missing
        return {
            branchesCount: 3,
            commitsCount: 24,
            branches: ['main', 'develop', 'feature/auth'],
            latestCommits: [
                { sha: 'a1b2c3d', message: 'Initial commit', author: 'leader', date: new Date().toISOString(), branch: 'main' },
                { sha: 'e5f6g7h', message: 'Update README.md', author: 'member', date: new Date().toISOString(), branch: 'develop' }
            ]
        };
    }

    try {
        // Fetch branches count (up to 100)
        const branchesRes = await client.get(`/repos/${owner}/${repo}/branches`, {
            params: { per_page: 100 }
        });
        const branches = Array.isArray(branchesRes.data) ? branchesRes.data.map(b => b.name) : [];
        
        // Fetch total commits count of the default branch
        let commitsCount = 0;
        const defaultBranchForCount = branches[0] || 'main';
        try {
            const commitsCountRes = await client.get(`/repos/${owner}/${repo}/commits`, {
                params: { sha: defaultBranchForCount, per_page: 1 }
            });
            const linkHeader = commitsCountRes.headers.link;
            if (linkHeader) {
                const match = linkHeader.match(/page=(\d+)>;\s*rel="last"/);
                if (match) {
                    commitsCount = parseInt(match[1], 10);
                } else {
                    commitsCount = Array.isArray(commitsCountRes.data) ? commitsCountRes.data.length : 0;
                }
            } else {
                commitsCount = Array.isArray(commitsCountRes.data) ? commitsCountRes.data.length : 0;
            }
        } catch (e) {
            console.error('[GitHub API] Lỗi khi đếm tổng số commits:', e.message);
        }

        // Fetch commits from each branch in parallel (up to 10 branches)
        let allCommitsMap = new Map();
        const branchListToFetch = branches.slice(0, 10);
        
        await Promise.all(branchListToFetch.map(async (branchName) => {
            try {
                const commitsRes = await client.get(`/repos/${owner}/${repo}/commits`, {
                    params: { sha: branchName, per_page: 10 }
                });
                if (Array.isArray(commitsRes.data)) {
                    commitsRes.data.forEach(c => {
                        if (!allCommitsMap.has(c.sha)) {
                            allCommitsMap.set(c.sha, {
                                sha: c.sha,
                                message: c.commit.message,
                                author: c.commit.author?.name || c.author?.login || 'Unknown',
                                date: c.commit.author?.date || c.commit.committer?.date,
                                branch: branchName
                            });
                        }
                    });
                }
            } catch (e) {
                console.error(`[GitHub API] Lỗi khi lấy commits cho branch ${branchName}:`, e.message);
            }
        }));

        // Convert map to array, sort by date descending, and take latest 10
        const latestCommits = Array.from(allCommitsMap.values())
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);

        return {
            branchesCount: branches.length,
            commitsCount: commitsCount,
            branches,
            latestCommits
        };
    } catch (error) {
        console.error('[GitHub API] Lỗi khi lấy repo stats:', error.response?.data || error.message);
        return {
            branchesCount: 0,
            commitsCount: 0,
            branches: [],
            latestCommits: []
        };
    }
};

/**
 * Check if user is collaborator on GitHub
 */
export const checkCollaboratorStatus = async (owner, repo, username) => {
    const client = getGithubClient();
    if (!client) {
        console.warn(`[GitHub API Mock] Giả lập kiểm tra trạng thái collaborator của ${username} -> Active`);
        return true;
    }

    try {
        const response = await client.get(`/repos/${owner}/${repo}/collaborators/${username}`);
        return response.status === 204 || response.status === 200;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return false;
        }
        console.error('[GitHub API] Lỗi khi check collaborator status:', error.message);
        return false;
    }
};

/**
 * Get all collaborators of a GitHub repository
 */
export const getRepositoryCollaborators = async (owner, repo) => {
    const client = getGithubClient();
    if (!client) {
        // Mock collaborators for demo/testing when no token
        return ['PhanThanhThang04', 'leader', 'member'];
    }

    try {
        const response = await client.get(`/repos/${owner}/${repo}/collaborators`, {
            params: { per_page: 100 }
        });
        if (Array.isArray(response.data)) {
            return response.data.map(c => c.login);
        }
        return [];
    } catch (error) {
        console.error('[GitHub API] Lỗi khi lấy danh sách cộng tác viên:', error.response?.data || error.message);
        return [];
    }
};

/**
 * Create a GitHub Issue representing a task
 */
export const createGithubIssue = async (owner, repo, taskData, assigneeGithubUsername) => {
    console.log(`[GitHub API] Tạo Issue trên ${owner}/${repo} cho task: ${taskData.title}`);
    const client = getGithubClient();
    
    // Default labels
    const labels = [
        `status:${taskData.status ? String(taskData.status).toLowerCase().replace(' ', '-') : 'to-do'}`,
        `priority:${taskData.priority || 'Medium'}`,
        `difficulty:${taskData.difficulty || 'Medium'}`
    ];

    if (!client) {
        // Return a mock issue number for demo/testing when no token
        const mockIssueNumber = Math.floor(Math.random() * 1000) + 1;
        return {
            issueNumber: mockIssueNumber,
            issueUrl: `https://github.com/${owner}/${repo}/issues/${mockIssueNumber}`
        };
    }

    try {
        const body = {
            title: taskData.title,
            body: taskData.description || "No description provided.",
            labels: labels
        };

        if (assigneeGithubUsername) {
            body.assignees = [assigneeGithubUsername];
        }

        const response = await client.post(`/repos/${owner}/${repo}/issues`, body);
        return {
            issueNumber: response.data.number,
            issueUrl: response.data.html_url
        };
    } catch (error) {
        console.error('[GitHub API] Lỗi khi tạo issue:', error.response?.data || error.message);
        // Fallback mock issue number
        const mockIssueNumber = Math.floor(Math.random() * 1000) + 1;
        return {
            issueNumber: mockIssueNumber,
            issueUrl: `https://github.com/${owner}/${repo}/issues/${mockIssueNumber}`
        };
    }
};

/**
 * Update a GitHub Issue
 */
export const updateGithubIssue = async (owner, repo, issueNumber, taskData, assigneeGithubUsername) => {
    console.log(`[GitHub API] Cập nhật Issue #${issueNumber} trên ${owner}/${repo}`);
    const client = getGithubClient();

    if (!client || !issueNumber) {
        return { success: true };
    }

    // Build labels
    const labels = [
        `status:${taskData.status ? String(taskData.status).toLowerCase().replace(' ', '-') : 'to-do'}`,
        `priority:${taskData.priority || 'Medium'}`,
        `difficulty:${taskData.difficulty || 'Medium'}`
    ];

    try {
        const body = {
            title: taskData.title,
            body: taskData.description || "No description provided.",
            labels: labels
        };

        // Note: setting assignees explicitly replaces current assignees
        if (assigneeGithubUsername !== undefined) {
            body.assignees = assigneeGithubUsername ? [assigneeGithubUsername] : [];
        }

        if (taskData.status === 'Done') {
            body.state = 'closed';
        } else {
            body.state = 'open';
        }

        await client.patch(`/repos/${owner}/${repo}/issues/${issueNumber}`, body);
        return { success: true };
    } catch (error) {
        console.error('[GitHub API] Lỗi khi cập nhật issue:', error.response?.data || error.message);
        return { success: false };
    }
};

/**
 * Close/Open a GitHub Issue
 */
export const closeGithubIssue = async (owner, repo, issueNumber, isDone) => {
    console.log(`[GitHub API] Thay đổi trạng thái đóng/mở Issue #${issueNumber} trên ${owner}/${repo}`);
    const client = getGithubClient();

    if (!client || !issueNumber) {
        return { success: true };
    }

    try {
        await client.patch(`/repos/${owner}/${repo}/issues/${issueNumber}`, {
            state: isDone ? 'closed' : 'open'
        });
        return { success: true };
    } catch (error) {
        console.error('[GitHub API] Lỗi khi đổi trạng thái issue:', error.response?.data || error.message);
        return { success: false };
    }
};
