import * as services from '../services/project';

export const getAllProjects = async (req,res)=>{
    try {
        const respone = await services.getAllProjectsService();
        console.log(respone);
        return res.status(200).json(respone);
    } catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at get project controller: ' + error
        })
    }
}

export const getProjectById = async (req,res)=>{
    try {
        // console.log(req.query);
        const {id} = req.query;
        const respone = await services.getProjectByIdService(id);
        return res.status(200).json(respone);
    } catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at get project by id controller: ' + error
        })
    }
}