import * as services from '../services/workspace';

export const createWorkspace = async (req,res)=>{
    try {
        const {name, description, color, owner_id} = req.body;
        if(!name || !color || !owner_id) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameters: name, color, owner_id'
            })
        }
        const response = await services.createWorkspaceService(name, description, color, owner_id);
        if(response.err === 1) {
            return res.status(400).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at create workspace controller: ' + error
        })
    }
}

export const listWorkspaceByUser = async (req,res)=>{
    try {
        const {user_id} = req.body;
        if(!user_id) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: user_id'
            })
        }
        const response = await services.listWorkspaceByUserService(user_id);
        if(response.err === 1) {
            return res.status(400).json(response);
        }
        return res.status(200).json(response?.response);
    }
    catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at list workspace by user controller: ' + error
        })
    }
}

export const getWorkspaceById = async (req,res)=>{
    try {
        const {id} = req.params;
        if(!id) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing required parameter: id'
            })
        }
        const response = await services.getWorkspaceByIdService(id);
        if(response.err === 1) {
            return res.status(400).json(response);
        }
        return res.status(200).json(response?.response);
    }
    catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at get workspace by id controller: ' + error
        })
    }
}