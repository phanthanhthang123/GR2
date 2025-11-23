import projectRouter from './project';
import authRouter from './auth';
import workspaceRouter from './workspace';
import taskRouter from './task';

const initRoutes = (app) => {
    app.use('/api/v1/project', projectRouter);
    app.use('/api/v1/auth', authRouter);
    app.use('/api/v1/workspace', workspaceRouter);
    app.use('/api/v1/task', taskRouter);

    return app.use('/', (req, res) => {
        res.send('Server on ...');
        console.log('server on...');
    })
}


export default initRoutes;
