import * as services from '../services/auth';
import jwt from 'jsonwebtoken';

// Helper function to get userId from token (Bearer or cookie)
const getUserIdFromToken = (req) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.replace('Bearer ', '')
        : (req.cookies?.accessToken || null);

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return decoded.id;
        } catch (error) {
            console.error('Token verification failed:', error.message);
            return null;
        }
    }
    return null;
};

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

export const getAllUsers = async (req, res) => {
    try {
        const { search } = req.query;
        const response = await services.getAllUsersService(search);
        if(response.err === 1) {
            return res.status(400).json(response);
        }
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at get all users controller: ' + error
        })
    }
}

export const adminCreateUser = async (req, res) => {
    try {
        const { username, email, role } = req.body;
        if (!username || !email) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing inputs parameter'
            });
        }
        const response = await services.adminCreateUserService(username, email, role);
        const status = response.err === 0 ? 200 : 400;
        return res.status(status).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at admin create user controller: ' + error
        });
    }
}

export const adminUpdateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const response = await services.adminUpdateUserService(id, req.body);
        const status = response.err === 0 ? 200 : 400;
        return res.status(status).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at admin update user controller: ' + error
        });
    }
}

export const adminDeleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const response = await services.adminDeleteUserService(id);
        const status = response.err === 0 ? 200 : 400;
        return res.status(status).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at admin delete user controller: ' + error
        });
    }
}

export const firstChangePassword = async (req, res) => {
    try {
        const { id, newPassword } = req.body;
        if (!id || !newPassword) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing inputs parameter'
            });
        }
        const response = await services.firstChangePasswordService(id, newPassword);
        const status = response.err === 0 ? 200 : 400;
        return res.status(status).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at first change password controller: ' + error
        });
    }
}

export const updateProfile = async (req, res) => {
    try {
        const tokenUserId = getUserIdFromToken(req);
        const { id, username } = req.body;
        const userId = tokenUserId || id;

        if (!userId) {
            return res.status(401).json({
                err: 1,
                msg: 'Unauthorized'
            });
        }

        if (!username) {
            return res.status(400).json({
                err: 1,
                msg: 'Missing inputs parameter'
            });
        }

        const response = await services.updateProfileService(userId, { username });
        const status = response.err === 0 ? 200 : 400;
        return res.status(status).json(response);
    } catch (error) {
        return res.status(500).json({
            err: -1,
            msg: 'Failed at update profile controller: ' + error
        });
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


