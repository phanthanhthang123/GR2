import * as services from '../services/auth';

export const register = async (req,res) => {
    try {
        const {username, email, password} = req.body; 
        // console.log(username, email, password);
        
        if(!username || !email || !password) {
            return res.status(400).json({
                err : 1,
                msg : 'Missing inputs parameter'
            })
        }
        const response = await services.registerService(username, email, password);
        if(response.err === 1) {
            return res.status(400).json(response);
        }
        
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err : -1,
            msg : 'Failed at register controller: ' + error
        })
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body
        if(!email || !password) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing inputs parameter'
            })
        }
        const response = await services.loginService(email, password);
        // console.log(response)
        if (response.err === 0) {
            // Set cookies
            res.cookie('accessToken', response.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000 // 1 day
            })
            
            res.cookie('refreshToken', response.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            })

            // Remove tokens from response body for security
            const { token, refreshToken, ...userData } = response
            return res.status(200).json(response)
        }
        return res.status(400).json(response)
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Error from server: ' + error
        })
    }
}

export const logout = async (req, res) => {
    try {
        // Clear cookies
        res.clearCookie('accessToken')
        res.clearCookie('refreshToken')
        
        return res.status(200).json({
            err: 0,
            msg: 'Logout is successfully !'
        })
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Error from server: ' + error
        })
    }
}

export const editPassword = async (req, res) => {
    try {
        const { id, password, newPassword } = req.body
        if(!id || !password || !newPassword) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing inputs parameter'
            })
        }
        const response = await services.editPasswordService(id, password, newPassword)
        return res.status(200).json(response)
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Error from server: ' + error
        })
    }
}

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body
        if(!email) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing inputs parameter'
            })
        }
        const response = await services.forgotPasswordService(email)
        return res.status(200).json(response)
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Error from server: ' + error
        })
    }
}

export const resetPassword = async (req, res) => {
    try {
        console.log(req)
        const { token } = req.body;
        console.log("token",token)
        const { newPassword } = req.body
        console.log("newPassword",newPassword)
        if(!token || !newPassword) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing inputs parameter'
            })
        }
        const response = await services.resetPasswordService(token,newPassword)
        return res.status(200).json(response)
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Error from server: ' + error
        })
    }   
}

export const verifyEmail = async (req, res) => {
    try {
        const { email } = req.body
        if(!email) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing inputs parameter'
            })
        }
        const response = await services.verifyEmailService(email)
        return res.status(200).json(response)
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Error from server: ' + error
        })
    }   
}

// export const sendResetPasswordEmail = async (req, res) => {
//     try {
//         const { email } = req.body
//         if(!email) {
//             return res.status(400).json({
//                 err: 1,
//                 msg: 'Missing inputs parameter'
//             })
//         }
//         const response = await services.sendResetPasswordEmailService(email)
//         return res.status(200).json(response)
//     } catch (error) {
//         return res.status(500).json({
//             err: -1,
//             msg: 'Error from server: ' + error
//         })
//     }
// }


