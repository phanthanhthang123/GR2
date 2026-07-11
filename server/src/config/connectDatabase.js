import {Sequelize}  from 'sequelize';

// Option 1: Passing a connection URI
// const sequelize = new Sequelize('sqlite::memory:') // Example for sqlite
// const sequelize = new Sequelize('postgres://user:pass@example.com:5432/dbname') // Example for postgres

// Option 2: Passing parameters separately (sqlite)
// const sequelize = new Sequelize({
//   dialect: 'sqlite',
//   storage: 'path/to/database.sqlite'
// });

// Option 3: Passing parameters separately (other dialects)
const sequelize = new Sequelize(
    process.env.DB_NAME || 'project_manager',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || null,
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql', /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
        logging: false
    }
);

const connectDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Automatic migrations for GitHub integration columns
        const queryInterface = sequelize.getQueryInterface();
        
        // 1. Users table
        try {
            const usersTable = await queryInterface.describeTable('Users');
            if (!usersTable.githubUsername) {
                await queryInterface.addColumn('Users', 'githubUsername', {
                    type: Sequelize.STRING,
                    allowNull: true
                });
                console.log('Migration: Added githubUsername to Users table');
            }
        } catch (e) {
            console.error('Error migrating Users table:', e.message);
        }

        // 2. Projects table
        try {
            const projectsTable = await queryInterface.describeTable('Projects');
            if (!projectsTable.githubRepoOwner) {
                await queryInterface.addColumn('Projects', 'githubRepoOwner', {
                    type: Sequelize.STRING,
                    allowNull: true
                });
                console.log('Migration: Added githubRepoOwner to Projects table');
            }
            if (!projectsTable.githubRepoName) {
                await queryInterface.addColumn('Projects', 'githubRepoName', {
                    type: Sequelize.STRING,
                    allowNull: true
                });
                console.log('Migration: Added githubRepoName to Projects table');
            }
        } catch (e) {
            console.error('Error migrating Projects table:', e.message);
        }

        // 3. Project_Members table
        try {
            const pmTable = await queryInterface.describeTable('Project_Members');
            if (!pmTable.status) {
                await queryInterface.addColumn('Project_Members', 'status', {
                    type: Sequelize.ENUM('Pending', 'Active'),
                    defaultValue: 'Active'
                });
                console.log('Migration: Added status to Project_Members table');
            }
            if (!pmTable.githubInvitationId) {
                await queryInterface.addColumn('Project_Members', 'githubInvitationId', {
                    type: Sequelize.STRING,
                    allowNull: true
                });
                console.log('Migration: Added githubInvitationId to Project_Members table');
            }
        } catch (e) {
            console.error('Error migrating Project_Members table:', e.message);
        }

        // 4. Tasks table
        try {
            const tasksTable = await queryInterface.describeTable('Tasks');
            if (!tasksTable.githubIssueNumber) {
                await queryInterface.addColumn('Tasks', 'githubIssueNumber', {
                    type: Sequelize.INTEGER,
                    allowNull: true
                });
                console.log('Migration: Added githubIssueNumber to Tasks table');
            }
            if (!tasksTable.githubIssueUrl) {
                await queryInterface.addColumn('Tasks', 'githubIssueUrl', {
                    type: Sequelize.TEXT,
                    allowNull: true
                });
                console.log('Migration: Added githubIssueUrl to Tasks table');
            }
        } catch (e) {
            console.error('Error migrating Tasks table:', e.message);
        }

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

export default connectDatabase;