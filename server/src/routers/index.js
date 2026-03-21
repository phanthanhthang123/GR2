import projectRouter from './project';
import authRouter from './auth';
import workspaceRouter from './workspace';
import taskRouter from './task';
import chatRouter from './chat';

const initRoutes = (app) => {
    app.use('/api/v1/project', projectRouter);
    app.use('/api/v1/auth', authRouter);
    app.use('/api/v1/workspace', workspaceRouter);
    app.use('/api/v1/task', taskRouter);
    app.use('/api/v1/chat', chatRouter);

    return app.use('/', (req, res) => {
        res.send('Server on ...');
        console.log('server on...');
    })
}


export default initRoutes;
