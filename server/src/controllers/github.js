import db from '../models';
import { getRepoStats, checkCollaboratorStatus, getRepositoryCollaborators } from '../services/github';
import crypto from 'crypto';

// 1. Update user github username
export const updateGithubUsername = async (req, res) => {
    try {
        const { githubUsername } = req.body;
        // get userId from token
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') 
            ? authHeader.replace('Bearer ', '') 
            : (req.cookies?.accessToken || null);
        
        if (!token) {
            return res.status(401).json({ err: 1, msg: 'UNAUTHORIZED' });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const user = await db.Users.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ err: 1, msg: 'USER NOT FOUND' });
        }

        await user.update({
            githubUsername: githubUsername ? githubUsername.trim() : null
        });

        return res.status(200).json({
            err: 0,
            msg: 'OK',
            response: {
                id: user.id,
                username: user.username,
                githubUsername: user.githubUsername
            }
        });
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at update github username: ' + error.message
        });
    }
};

// 2. Manual synchronization
export const syncGithubProject = async (req, res) => {
    try {
        const { projectId } = req.body;
        if (!projectId) {
            return res.status(400).json({ err: 1, msg: 'Missing projectId' });
        }

        const project = await db.Project.findOne({
            where: { id: projectId },
            include: [
                {
                    model: db.Project_Member,
                    as: 'members',
                    include: [
                        {
                            model: db.Users,
                            as: 'user',
                            attributes: ['id', 'username', 'githubUsername']
                        }
                    ]
                }
            ]
        });

        if (!project) {
            return res.status(404).json({ err: 1, msg: 'Project not found' });
        }

        if (!project.githubRepoUrl) {
            return res.status(400).json({ err: 1, msg: 'Dự án này chưa liên kết với GitHub Repository' });
        }

        // Parse owner and repo
        const match = project.githubRepoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\s#\?.]+)/);
        if (!match) {
            return res.status(400).json({ err: 1, msg: 'URL GitHub không hợp lệ' });
        }

        const owner = match[1];
        const repo = match[2];

        // 1. Update project columns if not set
        if (!project.githubRepoOwner || !project.githubRepoName) {
            await project.update({
                githubRepoOwner: owner,
                githubRepoName: repo
            });
        }

        // 2. Sync members from GitHub collaborators
        let updatedCount = 0;
        
        try {
            // Fetch all active collaborator usernames from GitHub
            const repoCollaborators = await getRepositoryCollaborators(owner, repo);
            
            if (repoCollaborators && repoCollaborators.length > 0) {
                // Find all users in DB with these githubUsernames
                const usersWithGithub = await db.Users.findAll({
                    where: {
                        githubUsername: repoCollaborators
                    }
                });
                const collaboratorUserIds = usersWithGithub.map(u => u.id);
                
                // Add or activate members
                for (const u of usersWithGithub) {
                    const existingMember = project.members.find(m => m.user_id === u.id);
                    
                    if (!existingMember) {
                        // Create a new project member record
                        await db.Project_Member.create({
                            id: crypto.randomUUID(),
                            project_id: projectId,
                            user_id: u.id,
                            role: 'Developer',
                            status: 'Active',
                            githubInvitationId: null,
                            joined_at: new Date(),
                            createdAt: new Date(),
                            updatedAt: new Date()
                        });
                        updatedCount++;
                    } else if (existingMember.status === 'Pending') {
                        await existingMember.update({
                            status: 'Active',
                            githubInvitationId: null
                        });
                        updatedCount++;
                    }
                }

                // Remove members who have a githubUsername but are no longer in the collaborator list
                const leaderId = project.leader_id || project.created_by;
                const membersToRemove = project.members.filter(m => 
                    m.user?.githubUsername && 
                    m.user_id !== leaderId && 
                    !collaboratorUserIds.includes(m.user_id)
                );

                for (const member of membersToRemove) {
                    await member.destroy();
                    updatedCount++;
                    console.log(`[Sync] Đã xóa thành viên ${member.user?.username || member.user_id} do bị gỡ khỏi GitHub`);
                }
            }
            
            // Fallback: check any remaining pending members individually
            const remainingPendingMembers = project.members.filter(m => 
                m.status === 'Pending' && 
                m.user?.githubUsername &&
                (!repoCollaborators || !repoCollaborators.includes(m.user.githubUsername))
            );
            
            for (const member of remainingPendingMembers) {
                const isCollab = await checkCollaboratorStatus(owner, repo, member.user.githubUsername);
                if (isCollab) {
                    await member.update({
                        status: 'Active',
                        githubInvitationId: null
                    });
                    updatedCount++;
                }
            }
        } catch (syncError) {
            console.error('[Sync Members] Lỗi khi đồng bộ thành viên từ GitHub:', syncError.message);
        }

        // 3. Fetch repo stats
        const stats = await getRepoStats(owner, repo);

        // Notify client if any member status was updated
        if (updatedCount > 0) {
            const io = req.app.get('io');
            if (io) {
                io.emit(`project-members-updated:${projectId}`, { msg: 'GitHub status sync complete' });
            }
        }

        return res.status(200).json({
            err: 0,
            msg: 'Đồng bộ hoàn tất',
            stats,
            updatedMembersCount: updatedCount
        });

    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at sync project: ' + error.message
        });
    }
};

// 3. GitHub Webhook Handler
export const handleWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-hub-signature-256'];
        const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

        // Verify signature if secret is configured
        if (webhookSecret && signature) {
            const hmac = crypto.createHmac('sha256', webhookSecret);
            const digest = Buffer.from('sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex'), 'utf8');
            const checksum = Buffer.from(signature, 'utf8');
            if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
                return res.status(401).json({ err: 1, msg: 'Invalid signature' });
            }
        }

        const event = req.headers['x-github-event'];
        console.log(`[GitHub Webhook] Nhận sự kiện: ${event}`);

        if (event === 'member') {
            const { action, member, repository } = req.body;
            const githubUsername = member?.login;
            const repoName = repository?.name;
            const repoOwner = repository?.owner?.login;

            console.log(`[GitHub Webhook] Người dùng ${githubUsername} ${action} vào repo ${repoOwner}/${repoName}`);

            if (action === 'added' && githubUsername && repoName && repoOwner) {
                // Find matching project in DB
                const project = await db.Project.findOne({
                    where: {
                        githubRepoOwner: repoOwner,
                        githubRepoName: repoName
                    }
                });

                if (project) {
                    // Find user with this githubUsername
                    const user = await db.Users.findOne({
                        where: { githubUsername }
                    });

                    if (user) {
                        // Find Project Member and update status to Active
                        const projectMember = await db.Project_Member.findOne({
                            where: {
                                project_id: project.id,
                                user_id: user.id,
                                status: 'Pending'
                            }
                        });

                        if (projectMember) {
                            await projectMember.update({
                                status: 'Active',
                                githubInvitationId: null
                            });

                            console.log(`[GitHub Webhook] Cập nhật thành viên ${user.username} sang Active`);

                            // Notify online clients via Socket.io
                            const io = req.app.get('io');
                            if (io) {
                                io.emit(`project-members-updated:${project.id}`, {
                                    msg: `${user.username} has accepted GitHub invitation`
                                });
                            }
                        }
                    }
                }
            } else if (action === 'removed' && githubUsername && repoName && repoOwner) {
                // Find matching project in DB
                const project = await db.Project.findOne({
                    where: {
                        githubRepoOwner: repoOwner,
                        githubRepoName: repoName
                    }
                });

                if (project) {
                    // Find user with this githubUsername
                    const user = await db.Users.findOne({
                        where: { githubUsername }
                    });

                    if (user) {
                        const leaderId = project.leader_id || project.created_by;
                        if (user.id !== leaderId) {
                            // Find Project Member and destroy
                            const projectMember = await db.Project_Member.findOne({
                                where: {
                                    project_id: project.id,
                                    user_id: user.id
                                }
                            });

                            if (projectMember) {
                                await projectMember.destroy();
                                console.log(`[GitHub Webhook] Xoá thành viên ${user.username} khỏi dự án do bị gỡ khỏi GitHub`);

                                // Notify online clients via Socket.io
                                const io = req.app.get('io');
                                if (io) {
                                    io.emit(`project-members-updated:${project.id}`, {
                                        msg: `${user.username} has been removed from GitHub repository`
                                    });
                                }
                            }
                        }
                    }
                }
            }
        } else if (event === 'issues') {
            const { action, issue, repository } = req.body;
            const repoName = repository?.name;
            const repoOwner = repository?.owner?.login;
            const issueNumber = issue?.number;

            if (repoName && repoOwner && issueNumber) {
                // Find matching project in DB
                const project = await db.Project.findOne({
                    where: {
                        githubRepoOwner: repoOwner,
                        githubRepoName: repoName
                    }
                });

                if (project) {
                    console.log(`[GitHub Webhook] Nhận sự kiện Issues: ${action} #${issueNumber} cho dự án ${project.name}`);

                    // Parse labels to determine status, priority, difficulty
                    let status = 'To Do';
                    let priority = 'Medium';
                    let difficulty = 'Medium';

                    if (issue.labels && Array.isArray(issue.labels)) {
                        issue.labels.forEach(label => {
                            const name = label.name.toLowerCase();
                            if (name === 'status:to-do') status = 'To Do';
                            else if (name === 'status:in-progress') status = 'In Progress';
                            else if (name === 'status:done') status = 'Done';
                            
                            if (name === 'priority:low') priority = 'Low';
                            else if (name === 'priority:medium') priority = 'Medium';
                            else if (name === 'priority:high') priority = 'High';

                            if (name === 'difficulty:easy') difficulty = 'Easy';
                            else if (name === 'difficulty:medium') difficulty = 'Medium';
                            else if (name === 'difficulty:hard') difficulty = 'Hard';
                        });
                    }

                    // If closed, override status to Done
                    if (issue.state === 'closed') {
                        status = 'Done';
                    } else if (action === 'reopened' && status === 'Done') {
                        status = 'In Progress'; // Default when reopened and status was Done
                    }

                    // Resolve assignee
                    let assignedTo = null;
                    const assigneeGithubUsername = issue.assignee?.login;
                    if (assigneeGithubUsername) {
                        const assignedUser = await db.Users.findOne({
                            where: { githubUsername: assigneeGithubUsername }
                        });
                        if (assignedUser) {
                            assignedTo = assignedUser.id;
                        }
                    }

                    // Find if task already exists in DB
                    let task = await db.Task.findOne({
                        where: {
                            project_id: project.id,
                            githubIssueNumber: issueNumber
                        }
                    });

                    if (task) {
                        // Update existing task
                        await task.update({
                            title: issue.title,
                            description: issue.body || '',
                            status,
                            priority,
                            difficulty,
                            assigned_to: assignedTo,
                            updatedAt: new Date()
                        });
                        console.log(`[GitHub Webhook] Cập nhật Task #${task.id} thành công`);
                    } else if (action === 'opened') {
                        // Create a new task locally
                        task = await db.Task.create({
                            project_id: project.id,
                            assigned_to: assignedTo,
                            title: issue.title,
                            description: issue.body || '',
                            status,
                            priority,
                            difficulty,
                            githubIssueNumber: issueNumber,
                            githubIssueUrl: issue.html_url,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        });
                        console.log(`[GitHub Webhook] Tạo mới Task #${task.id} từ GitHub Issue #${issueNumber}`);
                    }

                    if (task) {
                        // Update project progress
                        const { updateProjectProgress } = await import('../services/task');
                        await updateProjectProgress(project.id);

                        // Broadcast to client via Socket.io
                        const io = req.app.get('io');
                        if (io) {
                            io.emit(`project-github-activity:${project.id}`, {
                                msg: `Task sync from GitHub Issue #${issueNumber}`
                            });
                        }
                    }
                }
            }
        } else if (event === 'push' || event === 'create' || event === 'delete') {
            // General repository activities to trigger UI refresh
            const { repository } = req.body;
            const repoName = repository?.name;
            const repoOwner = repository?.owner?.login;

            const project = await db.Project.findOne({
                where: {
                    githubRepoOwner: repoOwner,
                    githubRepoName: repoName
                }
            });

            if (project) {
                const io = req.app.get('io');
                if (io) {
                    io.emit(`project-github-activity:${project.id}`, { event });
                }
            }
        }

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('[GitHub Webhook] Lỗi khi xử lý:', error.message);
        return res.status(500).json({ err: -1, msg: error.message });
    }
};
