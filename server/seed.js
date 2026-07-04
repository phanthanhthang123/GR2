const db = require('./src/models');
const bcrypt = require('bcrypt');

// Deterministic values for KPI fields to make sure ML model predictions run correctly
const getRandomKpiFields = (id) => {
  const num = parseInt(id.replace('U', ''), 10);
  const cpa = (3.0 + (num % 10) * 0.1).toFixed(2); // 3.0 to 3.9
  const interviewScore = (70 + (num % 7) * 4); // 70 to 94
  const cvScore = (75 + (num % 5) * 5); // 75 to 95
  const yearsExperience = (num % 6); // 0 to 5
  const numProjectsPrior = (num % 4) + 1; // 1 to 4
  const yearsAtCompany = (num % 5) + 0.5; // 0.5 to 4.5
  const kpiScore = (0.6 + (num % 5) * 0.08).toFixed(2); // 0.6 to 0.92
  return {
    cpa: parseFloat(cpa),
    interviewScore: parseFloat(interviewScore),
    cvScore: parseFloat(cvScore),
    yearsExperience,
    numProjectsPrior,
    yearsAtCompany,
    kpiScore: parseFloat(kpiScore),
    kpiModelAtSignup: num % 2 === 0 ? 'A' : 'B'
  };
};

async function seed() {
  console.log('Starting database seeding...');
  
  try {
    // 1. Disable foreign key checks
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('Disabled foreign key checks.');

    // 2. Drop and recreate all tables using Sequelize sync
    console.log('Syncing database (force: true)...');
    await db.sequelize.sync({ force: true });
    console.log('Database schema recreated/synced successfully.');

    // 3. Hash password
    const plainPassword = 'password123';
    console.log(`Hashing password: "${plainPassword}"...`);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    console.log('Password hashed successfully.');

    // 4. Generate Users
    const roles = ['Admin', 'Leader', 'Member'];
    const usernames = [
      'john_doe', 'jane_smith', 'bob_wilson', 'alice_johnson', 'charlie_brown',
      'diana_prince', 'bruce_wayne', 'clark_kent', 'peter_parker', 'tony_stark',
      'steve_rogers', 'natasha_romanoff', 'thor_odinson', 'bruce_banner', 'wanda_maximoff',
      'vision', 'sam_wilson', 'bucky_barnes', 'stephen_strange', 'wong',
      'carol_danvers', 'monica_rambeau', 'kamala_khan', 'peter_quill', 'gamora',
      'drax', 'rocket', 'groot', 'mantis', 'nebula', 'loki', 'valkyrie',
      'korg', 'miek', 'heimdall', 'frigga', 'odin', 'laufey', 'thanos', 'ebony_maw'
    ];

    const usersData = [];
    for (let i = 1; i <= 40; i++) {
      const id = 'U' + String(i).padStart(3, '0');
      const username = usernames[i - 1];
      
      // Determine email: john@example.com for first, jane@example.com for second, bob@example.com for third, etc.
      let email = `${username.replace('_', '.')}@example.com`;
      if (i === 1) email = 'john@example.com';
      if (i === 2) email = 'jane@example.com';
      if (i === 3) email = 'bob@example.com';
      if (i === 4) email = 'alice@example.com';
      if (i === 7) email = 'bruce.wayne@example.com';
      if (i === 14) email = 'bruce.banner@example.com';

      // Roles: U001 is Admin, others alternate Leader & Member
      let role = 'Member';
      if (i === 1) {
        role = 'Admin';
      } else if ([2, 5, 7, 10, 13, 16, 19, 21, 24, 27, 30, 33, 36, 39].includes(i)) {
        role = 'Leader';
      }

      const kpiFields = getRandomKpiFields(id);

      usersData.push({
        id,
        username,
        email,
        password: hashedPassword,
        role,
        mustChangePassword: false,
        isActive: true,
        ...kpiFields,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    await db.Users.bulkCreate(usersData);
    console.log(`Seeded ${usersData.length} Users.`);

    // 5. Generate Workspaces
    const workspacesData = [
      { id: 'W001', name: 'Tech Solutions', description: 'Workspace cho team phát triển công nghệ', owner_id: 'U001', color: '#3B82F6', status: 'Active' },
      { id: 'W002', name: 'Marketing Team', description: 'Workspace cho team marketing và truyền thông', owner_id: 'U002', color: '#EF4444', status: 'Active' },
      { id: 'W003', name: 'Design Studio', description: 'Workspace cho team thiết kế và UI/UX', owner_id: 'U007', color: '#10B981', status: 'Active' },
      { id: 'W004', name: 'Data Analytics', description: 'Workspace cho team phân tích dữ liệu', owner_id: 'U010', color: '#8B5CF6', status: 'Active' },
      { id: 'W005', name: 'DevOps Team', description: 'Workspace cho team DevOps và infrastructure', owner_id: 'U013', color: '#F59E0B', status: 'Active' },
      { id: 'W006', name: 'QA Testing', description: 'Workspace cho team kiểm thử chất lượng', owner_id: 'U016', color: '#EC4899', status: 'Active' },
      { id: 'W007', name: 'Product Management', description: 'Workspace cho team quản lý sản phẩm', owner_id: 'U019', color: '#06B6D4', status: 'Active' },
      { id: 'W008', name: 'Customer Support', description: 'Workspace cho team hỗ trợ khách hàng', owner_id: 'U021', color: '#84CC16', status: 'Active' }
    ].map(w => ({
      ...w,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await db.Workspaces.bulkCreate(workspacesData);
    console.log(`Seeded ${workspacesData.length} Workspaces.`);

    // 6. Generate Workspace Members
    const workspaceMembersData = [
      { id: 1, workspace_id: 'W001', user_id: 'U001', role: 'Leader' },
      { id: 2, workspace_id: 'W001', user_id: 'U002', role: 'Manager' },
      { id: 3, workspace_id: 'W001', user_id: 'U003', role: 'Developer' },
      { id: 4, workspace_id: 'W001', user_id: 'U004', role: 'Developer' },
      { id: 5, workspace_id: 'W001', user_id: 'U005', role: 'Developer' },
      { id: 6, workspace_id: 'W002', user_id: 'U002', role: 'Leader' },
      { id: 7, workspace_id: 'W002', user_id: 'U006', role: 'Manager' },
      { id: 8, workspace_id: 'W002', user_id: 'U007', role: 'Developer' },
      { id: 9, workspace_id: 'W002', user_id: 'U008', role: 'Developer' },
      { id: 10, workspace_id: 'W003', user_id: 'U007', role: 'Leader' },
      { id: 11, workspace_id: 'W003', user_id: 'U009', role: 'Manager' },
      { id: 12, workspace_id: 'W003', user_id: 'U010', role: 'Developer' },
      { id: 13, workspace_id: 'W003', user_id: 'U011', role: 'Developer' },
      { id: 14, workspace_id: 'W004', user_id: 'U010', role: 'Leader' },
      { id: 15, workspace_id: 'W004', user_id: 'U012', role: 'Manager' },
      { id: 16, workspace_id: 'W004', user_id: 'U013', role: 'Developer' },
      { id: 17, workspace_id: 'W004', user_id: 'U014', role: 'Developer' },
      { id: 18, workspace_id: 'W005', user_id: 'U013', role: 'Leader' },
      { id: 19, workspace_id: 'W005', user_id: 'U015', role: 'Manager' },
      { id: 20, workspace_id: 'W005', user_id: 'U016', role: 'Developer' },
      { id: 21, workspace_id: 'W005', user_id: 'U017', role: 'Developer' },
      { id: 22, workspace_id: 'W006', user_id: 'U016', role: 'Leader' },
      { id: 23, workspace_id: 'W006', user_id: 'U018', role: 'Manager' },
      { id: 24, workspace_id: 'W006', user_id: 'U019', role: 'Developer' },
      { id: 25, workspace_id: 'W006', user_id: 'U020', role: 'Developer' },
      { id: 26, workspace_id: 'W007', user_id: 'U019', role: 'Leader' },
      { id: 27, workspace_id: 'W007', user_id: 'U021', role: 'Manager' },
      { id: 28, workspace_id: 'W007', user_id: 'U022', role: 'Developer' },
      { id: 29, workspace_id: 'W007', user_id: 'U023', role: 'Developer' },
      { id: 30, workspace_id: 'W008', user_id: 'U021', role: 'Leader' },
      { id: 31, workspace_id: 'W008', user_id: 'U024', role: 'Manager' },
      { id: 32, workspace_id: 'W008', user_id: 'U025', role: 'Developer' },
      { id: 33, workspace_id: 'W008', user_id: 'U026', role: 'Developer' }
    ].map(m => ({
      ...m,
      joined_at: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await db.Workspace_Members.bulkCreate(workspaceMembersData);
    console.log(`Seeded ${workspaceMembersData.length} Workspace Members.`);

    // 7. Generate Projects
    const projectsData = [
      { id: 'P001', leader_id: 'U002', workspace_id: 'W001', name: 'Website Redesign', description: 'Thiết kế lại giao diện website', start_date: '2026-01-01', end_date: '2026-03-31', status: 'In Progress', created_by: 'U001' },
      { id: 'P002', leader_id: 'U005', workspace_id: 'W001', name: 'Mobile App', description: 'Phát triển ứng dụng di động', start_date: '2026-02-01', end_date: '2026-05-01', status: 'Pending', created_by: 'U002' },
      { id: 'P003', leader_id: 'U007', workspace_id: 'W003', name: 'API Platform', description: 'Xây dựng nền tảng API', start_date: '2026-03-01', end_date: '2026-06-01', status: 'Completed', created_by: 'U003' },
      { id: 'P004', leader_id: 'U010', workspace_id: 'W004', name: 'Security Audit', description: 'Kiểm thử bảo mật hệ thống', start_date: '2026-04-01', end_date: '2026-07-01', status: 'In Progress', created_by: 'U004' },
      { id: 'P005', leader_id: 'U013', workspace_id: 'W005', name: 'Cloud Infra', description: 'Triển khai hạ tầng cloud', start_date: '2026-05-01', end_date: '2026-08-01', status: 'Pending', created_by: 'U005' },
      { id: 'P006', leader_id: 'U016', workspace_id: 'W006', name: 'Data Migration', description: 'Di chuyển dữ liệu', start_date: '2026-06-01', end_date: '2026-09-01', status: 'In Progress', created_by: 'U006' },
      { id: 'P007', leader_id: 'U019', workspace_id: 'W007', name: 'UI/UX Update', description: 'Cải tiến trải nghiệm người dùng', start_date: '2026-07-01', end_date: '2026-10-01', status: 'Completed', created_by: 'U007' },
      { id: 'P008', leader_id: 'U021', workspace_id: 'W008', name: 'Testing Suite', description: 'Xây dựng bộ kiểm thử', start_date: '2026-08-01', end_date: '2026-11-01', status: 'Pending', created_by: 'U008' },
      { id: 'P009', leader_id: 'U024', workspace_id: 'W001', name: 'Project Documentation', description: 'Viết tài liệu dự án', start_date: '2026-09-01', end_date: '2026-12-01', status: 'In Progress', created_by: 'U009' },
      { id: 'P010', leader_id: 'U027', workspace_id: 'W002', name: 'Performance Optimization', description: 'Tối ưu hiệu năng', start_date: '2026-10-01', end_date: '2027-01-01', status: 'Pending', created_by: 'U010' },
      { id: 'P011', leader_id: 'U030', workspace_id: 'W003', name: 'Backend API', description: 'Phát triển API backend', start_date: '2026-11-01', end_date: '2027-02-01', status: 'In Progress', created_by: 'U011' },
      { id: 'P012', leader_id: 'U033', workspace_id: 'W004', name: 'Frontend Development', description: 'Phát triển giao diện', start_date: '2026-12-01', end_date: '2027-03-01', status: 'Pending', created_by: 'U012' },
      { id: 'P013', leader_id: 'U036', workspace_id: 'W005', name: 'Database Optimization', description: 'Tối ưu cơ sở dữ liệu', start_date: '2027-01-01', end_date: '2027-04-01', status: 'In Progress', created_by: 'U013' },
      { id: 'P014', leader_id: 'U039', workspace_id: 'W006', name: 'Security Enhancement', description: 'Bảo mật hệ thống', start_date: '2027-02-01', end_date: '2027-05-01', status: 'Pending', created_by: 'U014' },
      { id: 'P015', leader_id: 'U002', workspace_id: 'W007', name: 'Mobile Web App', description: 'Phát triển web mobile', start_date: '2027-03-01', end_date: '2027-06-01', status: 'In Progress', created_by: 'U015' },
      { id: 'P016', leader_id: 'U005', workspace_id: 'W008', name: 'Data Analytics', description: 'Phân tích dữ liệu', start_date: '2027-04-01', end_date: '2027-07-01', status: 'Pending', created_by: 'U016' },
      { id: 'P017', leader_id: 'U007', workspace_id: 'W001', name: 'System Monitoring', description: 'Giám sát hệ thống', start_date: '2027-05-01', end_date: '2027-08-01', status: 'In Progress', created_by: 'U017' },
      { id: 'P018', leader_id: 'U010', workspace_id: 'W002', name: 'Data Backup', description: 'Sao lưu dữ liệu', start_date: '2027-06-01', end_date: '2027-09-01', status: 'Pending', created_by: 'U018' },
      { id: 'P019', leader_id: 'U013', workspace_id: 'W003', name: 'System Deployment', description: 'Triển khai hệ thống', start_date: '2027-07-01', end_date: '2027-10-01', status: 'In Progress', created_by: 'U019' },
      { id: 'P020', leader_id: 'U016', workspace_id: 'W004', name: 'System Maintenance', description: 'Bảo trì hệ thống', start_date: '2027-08-01', end_date: '2027-11-01', status: 'Pending', created_by: 'U020' },
      { id: 'P021', leader_id: 'U019', workspace_id: 'W005', name: 'System Integration', description: 'Tích hợp hệ thống', start_date: '2027-09-01', end_date: '2027-12-01', status: 'In Progress', created_by: 'U021' },
      { id: 'P022', leader_id: 'U021', workspace_id: 'W006', name: 'System Testing', description: 'Kiểm thử hệ thống', start_date: '2027-10-01', end_date: '2028-01-01', status: 'Pending', created_by: 'U022' },
      { id: 'P023', leader_id: 'U024', workspace_id: 'W007', name: 'System Documentation', description: 'Tài liệu hệ thống', start_date: '2027-11-01', end_date: '2028-02-01', status: 'In Progress', created_by: 'U023' },
      { id: 'P024', leader_id: 'U027', workspace_id: 'W008', name: 'User Training', description: 'Đào tạo người dùng', start_date: '2027-12-01', end_date: '2028-03-01', status: 'Pending', created_by: 'U024' },
      { id: 'P025', leader_id: 'U030', workspace_id: 'W001', name: 'User Support', description: 'Hỗ trợ người dùng', start_date: '2028-01-01', end_date: '2028-04-01', status: 'In Progress', created_by: 'U025' },
      { id: 'P026', leader_id: 'U033', workspace_id: 'W002', name: 'System Upgrade', description: 'Nâng cấp hệ thống', start_date: '2028-02-01', end_date: '2028-05-01', status: 'Pending', created_by: 'U026' },
      { id: 'P027', leader_id: 'U036', workspace_id: 'W003', name: 'Data Migration 2', description: 'Di chuyển dữ liệu', start_date: '2028-03-01', end_date: '2028-06-01', status: 'In Progress', created_by: 'U027' },
      { id: 'P028', leader_id: 'U039', workspace_id: 'W004', name: 'Security Update', description: 'Bảo mật dữ liệu', start_date: '2028-04-01', end_date: '2028-07-01', status: 'Pending', created_by: 'U028' },
      { id: 'P029', leader_id: 'U002', workspace_id: 'W005', name: 'System Backup', description: 'Sao lưu hệ thống', start_date: '2028-05-01', end_date: '2028-08-01', status: 'In Progress', created_by: 'U029' },
      { id: 'P030', leader_id: 'U005', workspace_id: 'W006', name: 'Data Recovery', description: 'Khôi phục dữ liệu', start_date: '2028-06-01', end_date: '2028-09-01', status: 'Pending', created_by: 'U030' },
      { id: 'P031', leader_id: 'U007', workspace_id: 'W007', name: 'Performance Monitoring', description: 'Giám sát hiệu năng', start_date: '2028-07-01', end_date: '2028-10-01', status: 'In Progress', created_by: 'U031' },
      { id: 'P032', leader_id: 'U010', workspace_id: 'W008', name: 'Performance Analytics', description: 'Phân tích hiệu năng', start_date: '2028-08-01', end_date: '2028-11-01', status: 'Pending', created_by: 'U032' },
      { id: 'P033', leader_id: 'U013', workspace_id: 'W001', name: 'System Optimization', description: 'Tối ưu hiệu năng', start_date: '2028-09-01', end_date: '2028-12-01', status: 'In Progress', created_by: 'U033' },
      { id: 'P034', leader_id: 'U016', workspace_id: 'W002', name: 'System Scaling', description: 'Mở rộng hệ thống', start_date: '2028-10-01', end_date: '2029-01-01', status: 'Pending', created_by: 'U034' },
      { id: 'P035', leader_id: 'U019', workspace_id: 'W003', name: 'API Integration', description: 'Tích hợp API', start_date: '2028-11-01', end_date: '2029-02-01', status: 'In Progress', created_by: 'U035' },
      { id: 'P036', leader_id: 'U021', workspace_id: 'W004', name: 'API Testing', description: 'Kiểm thử API', start_date: '2028-12-01', end_date: '2029-03-01', status: 'Pending', created_by: 'U036' },
      { id: 'P037', leader_id: 'U024', workspace_id: 'W005', name: 'API Documentation', description: 'Tài liệu API', start_date: '2029-01-01', end_date: '2029-04-01', status: 'In Progress', created_by: 'U037' },
      { id: 'P038', leader_id: 'U027', workspace_id: 'W006', name: 'API Training', description: 'Đào tạo API', start_date: '2029-02-01', end_date: '2029-05-01', status: 'Pending', created_by: 'U038' },
      { id: 'P039', leader_id: 'U030', workspace_id: 'W007', name: 'API Support', description: 'Hỗ trợ API', start_date: '2029-03-01', end_date: '2029-06-01', status: 'In Progress', created_by: 'U039' },
      { id: 'P040', leader_id: 'U033', workspace_id: 'W008', name: 'API Maintenance', description: 'Bảo trì API', start_date: '2029-04-01', end_date: '2029-07-01', status: 'Pending', created_by: 'U040' }
    ].map(p => ({
      ...p,
      githubRepoUrl: 'https://github.com/phanthanhthang123/DoAnTotNghiep.git',
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await db.Project.bulkCreate(projectsData);
    console.log(`Seeded ${projectsData.length} Projects.`);

    // 8. Generate Project Members dynamically
    const workspaceToUsers = {
      'W001': ['U001', 'U002', 'U003', 'U004', 'U005'],
      'W002': ['U002', 'U006', 'U007', 'U008'],
      'W003': ['U007', 'U009', 'U010', 'U011'],
      'W004': ['U010', 'U012', 'U013', 'U014'],
      'W005': ['U013', 'U015', 'U016', 'U017'],
      'W006': ['U016', 'U018', 'U019', 'U020'],
      'W007': ['U019', 'U021', 'U022', 'U023'],
      'W008': ['U021', 'U024', 'U025', 'U026']
    };

    const projectMembersData = [];
    let pmIndex = 1;

    for (const proj of projectsData) {
      const wId = proj.workspace_id;
      const uIds = workspaceToUsers[wId] || ['U001', 'U002', 'U003'];
      
      const uniqueUsers = new Set(uIds);
      if (proj.leader_id) uniqueUsers.add(proj.leader_id);
      if (proj.created_by) uniqueUsers.add(proj.created_by);

      for (const uId of uniqueUsers) {
        projectMembersData.push({
          id: 'PM' + String(pmIndex++).padStart(3, '0'),
          user_id: uId,
          project_id: proj.id,
          role: uId === proj.leader_id ? 'Leader' : (uId === proj.created_by ? 'Manager' : 'Developer'),
          joined_at: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    await db.Project_Member.bulkCreate(projectMembersData);
    console.log(`Seeded ${projectMembersData.length} Project Members.`);

    // 9. Generate Tasks programmatically (at least 6-10 tasks per project)
    const taskTemplates = [
      { title: 'Phân tích yêu cầu và đặc tả hệ thống', description: 'Chi tiết hóa tài liệu yêu cầu nghiệp vụ và sơ đồ thực thể hệ thống.' },
      { title: 'Thiết kế wireframe & giao diện UI/UX', description: 'Thiết kế giao diện Figma cho các màn hình Dashboard, Kanban Board và Cài đặt.' },
      { title: 'Thiết kế cấu trúc cơ sở dữ liệu', description: 'Xác định quan hệ các bảng, kiểu dữ liệu, các ràng buộc khóa ngoại và index.' },
      { title: 'Cấu hình dự án & Docker Compose', description: 'Khởi tạo mã nguồn Client/Server, Dockerfile và cấu hình docker-compose chạy dev.' },
      { title: 'Phát triển module JWT Authentication', description: 'Viết API Login, Register, Refresh Token, mã hóa bcrypt mật khẩu.' },
      { title: 'Xây dựng REST API cho tài nguyên chính', description: 'Xây dựng bộ API CRUD cho Workspaces, Projects, Tasks và Members.' },
      { title: 'Phát triển giao diện Dashboard & Kanban', description: 'Xây dựng React/Vite components, Kanban board kéo thả và trang thống kê dự án.' },
      { title: 'Tích hợp mô hình dự báo rủi ro AI', description: 'Tích hợp module Python chạy Random Forest để đưa ra xác suất chậm trễ dự án.' },
      { title: 'Viết unit test & tích hợp kiểm thử API', description: 'Tạo test suite bằng Jest/Supertest kiểm tra toàn bộ luồng nghiệp vụ.' },
      { title: 'Tối ưu hóa hiệu năng & Bảo mật API', description: 'Rate limiting, ngăn chặn SQL Injection, tối ưu hóa câu truy vấn SQL.' },
      { title: 'Hoàn thiện tài liệu hướng dẫn & tài liệu API', description: 'Viết tài liệu Swagger API, viết file README hướng dẫn chạy dự án chi tiết.' },
      { title: 'Triển khai Staging & kiểm thử lần cuối', description: 'Triển khai dự án lên Cloud hosting, cấu hình tên miền và kiểm thử E2E.' }
    ];

    const tasksData = [];
    let taskIdCounter = 1001;

    for (let pIndex = 1; pIndex <= 40; pIndex++) {
      const pId = 'P' + String(pIndex).padStart(3, '0');
      // Get members for this project to assign tasks to
      const pMembers = projectMembersData.filter(pm => pm.project_id === pId);
      const memberUserIds = pMembers.map(pm => pm.user_id);
      
      const numTasks = (pIndex % 4) + 6; // 6 to 9 tasks per project
      for (let tIndex = 0; tIndex < numTasks; tIndex++) {
        const id = taskIdCounter++;
        const template = taskTemplates[tIndex % taskTemplates.length];
        
        // Cycle status: 2 completed, 2 in progress, remainder in todo
        let status = 'To Do';
        if (tIndex < 2) {
          status = 'Done';
        } else if (tIndex < 4) {
          status = 'In Progress';
        }

        const priority = tIndex % 3 === 0 ? 'High' : (tIndex % 3 === 1 ? 'Medium' : 'Low');
        const difficulty = tIndex % 3 === 0 ? 'Hard' : (tIndex % 3 === 1 ? 'Medium' : 'Easy');
        
        // Assigned to cycling project members
        const assignedTo = memberUserIds.length > 0 ? memberUserIds[tIndex % memberUserIds.length] : 'U001';

        const dueDate = new Date();
        // Some overdue, some upcoming
        dueDate.setDate(dueDate.getDate() + ((tIndex % 10) - 4));

        tasksData.push({
          id,
          project_id: pId,
          assigned_to: assignedTo,
          title: `${template.title} - ${pId}`,
          description: template.description,
          status,
          priority,
          difficulty,
          pullRequestUrl: status === 'Done' ? 'https://github.com/phanthanhthang123/DoAnTotNghiep/pull/1' : null,
          dueDate,
          isArchived: false,
          createdAt: new Date('2026-01-01T08:00:00Z'),
          updatedAt: new Date()
        });
      }
    }

    await db.Task.bulkCreate(tasksData);
    console.log(`Seeded ${tasksData.length} Tasks.`);

    // 10. Generate Progress dynamically based on the percentage of Done tasks
    const progressData = [];
    for (let i = 1; i <= 40; i++) {
      const pId = 'P' + String(i).padStart(3, '0');
      const projectTasks = tasksData.filter(t => t.project_id === pId);
      const total = projectTasks.length;
      const done = projectTasks.filter(t => t.status === 'Done').length;
      const progressVal = total > 0 ? Math.round((done / total) * 100) : 0;
      
      progressData.push({
        id: 2000 + i,
        project_id: pId,
        progress: progressVal,
        updatedAt: new Date()
      });
    }

    await db.Progress.bulkCreate(progressData);
    console.log(`Seeded ${progressData.length} Progress entries.`);

    // 11. Generate Project Predictions matching the real project progress
    const predictionsData = [];
    for (let i = 1; i <= 40; i++) {
      const pId = 'P' + String(i).padStart(3, '0');
      const delayRiskLevel = i % 3 === 0 ? 'High' : (i % 3 === 1 ? 'Medium' : 'Low');
      
      const estDate = new Date();
      estDate.setDate(estDate.getDate() + (i % 10));

      const actualDate = i % 4 === 0 ? new Date() : null;
      const progressRecord = progressData.find(pr => pr.project_id === pId);
      const progressVal = progressRecord ? progressRecord.progress : 0;

      predictionsData.push({
        id: 'PP' + String(i).padStart(3, '0'),
        project_id: pId,
        estimated_completion_date: estDate,
        actual_completion_date: actualDate,
        progress_percentage: progressVal,
        delay_risk_level: delayRiskLevel,
        delay_reason: i % 3 === 0 ? 'avg_member_kpi (Hiệu suất team chưa tốt), remaining_hard_tasks (Còn nhiều task khó)' : 'N/A',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await db.Project_Prediction.bulkCreate(predictionsData);
    console.log(`Seeded ${predictionsData.length} Project Predictions.`);

    // 12. Generate Notifications
    const notificationsData = [];
    for (let i = 1; i <= 40; i++) {
      const uId = 'U' + String((i % 40) + 1).padStart(3, '0');
      notificationsData.push({
        id: 'N' + String(i).padStart(3, '0'),
        user_id: uId,
        message: `Thông báo hệ thống mẫu số ${i}`,
        payload: JSON.stringify({ type: 'system', details: `Details for notification ${i}` }),
        is_read: i % 2 === 0 ? 'TRUE' : 'FALSE',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await db.Notification.bulkCreate(notificationsData);
    console.log(`Seeded ${notificationsData.length} Notifications.`);

    // 13. Enable foreign key checks back
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Re-enabled foreign key checks.');
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    // Try to re-enable foreign keys even in case of error
    try {
      await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (_) {}
    process.exit(1);
  }
}

seed().then(() => {
  process.exit(0);
});
