import db from '../models';

//GET ALL PROJECTS
export const getAllProjectsService = () => new Promise(async (resolve, reject) => {
    try {
        const response = await db.Project.findAll({
            raw: true,
            // attributes : ['id','name','description']
        });
        resolve({
            err: response ? 0 : 1,
            msg: response ? 'OK' : 'FAILED TO GET ALL PROJECTS',
            response
        });
    } catch (error) {
        reject(error);
    }
});

export const getProjectByIdService = (id)=> new Promise(async (resolve, reject)=>{
    try {
        const response = await db.Project.findOne({
            raw: true,
            attributes : ['id','name','description'],
            where: {
                id
            }
        });
        resolve({
            err: response ? 0 : 1,
            msg: response ? 'OK' : 'FAILED TO GET PROJECT BY ID',
            response
        });
    } catch (error) {
        reject(error);
    }
})