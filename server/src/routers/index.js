import projectRouter from './project';
import authRouter from './auth';

const initRoutes = (app) => {
    app.use('/api/v1/project', projectRouter);
    app.use('/api/v1/auth', authRouter);

    return app.use('/', (req, res) => {
        res.send('Server on ...');
        console.log('server on...');
    })
}


export default initRoutes;
