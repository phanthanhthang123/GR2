import db from '../models'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { v4 } from 'uuid'
import nodemailer from 'nodemailer'
import {
    isCloudinaryConfigured,
    configureCloudinary,
    uploadAvatarBuffer,
    destroyCloudinaryAsset,
} from '../config/cloudinary'



const hashPassword = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10))
}

const comparePassword = (password, hashPassword) => {
    return bcrypt.compareSync(password, hashPassword)
}

const generateToken = (username, id, role, mustChangePassword) => {
    return jwt.sign({ username, id, role, mustChangePassword }, process.env.JWT_SECRET, { expiresIn: '24h' })
}

const generateRefreshToken = (username, id, role) => {
    return jwt.sign({ username, id, role }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

const buildPublicUserProfile = (user) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
})

export const registerService = (username, email, password) => new Promise(async (resolve, reject) => {
    try {
        const response = await db.Users.findOrCreate({
            where: { email },
            defaults: {
                username,
                email,
                password: hashPassword(password),
                id: v4(),
                role: 'Member'
            }
        })
        //response[0] :data 
        // response[1] = true or false , true : da dc tao tk, false : tk da ton tai => da co token
        // const token = response[1] && generateToken(response[1].username,response[1].id, response[1].role)

        resolve({
            err: response[1] ? 0 : 1,
            msg: response[1] ? 'Register is successfully !' : 'Email hash been aldready used!',
            // token : token ? token : null
        })
    } catch (error) {
        reject(error)
    }
})

export const loginService = (email, password) => new Promise(async (resolve, reject) => {
    try {
        const user = await db.Users.findOne({
            where: { email },
            raw: true
        })
        if (user) {
            const isCorrectPassword = bcrypt.compareSync(password, user.password)
            if (isCorrectPassword) {
                const access_token = generateToken(user.username, user.id, user.role, user.mustChangePassword)
                const refresh_token = generateRefreshToken(user.username, user.id, user.role)

                const {
                    password: _pw,
                    resetToken: _rt,
                    resetTokenExpiry: _rte,
                    avatarPublicId: _apid,
                    ...safeUser
                } = user

                resolve({
                    err: 0,
                    msg: 'Login is successfully !',
                    token: access_token,
                    refreshToken: refresh_token,
                    response: safeUser
                })
            } else {
                resolve({
                    err: 1,
                    msg: 'Password is incorrect !'
                })
            }
        } else {
            resolve({
                err: 1,
                msg: 'Email is not exist !'
            })
        }
    } catch (error) {
        reject(error)
    }
})

export const editPasswordService = (id, oldPassword, newPassword) => new Promise(async (resolve, reject) => {
    try {
        const user = await db.Users.findOne({
            where: { id },
            raw: true
        })
        if (!user) {
            resolve({
                err: 1,
                msg: 'User is not exist'
            })
        }

        const isCorrectPassword = comparePassword(oldPassword, user.password)
        if (!isCorrectPassword) {
            resolve({
                err: 1,
                msg: 'Old password is incorrect'

            })
        }
        await db.Users.update({
            password: hashPassword(newPassword)
        }, {
            where: { id }
        })
        resolve({
            err: 0,
            msg: 'Password is updated successfully'
        })

    } catch (error) {
        reject(error)
    }
})

export const logoutService = () => new Promise(async (resolve, reject) => {
    try {
        resolve({
            err: 0,
            msg: 'Logout is successfully !'
        })
    } catch (error) {
        reject(error)
    }
})


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

// Hàm gửi email
const sendResetPasswordEmail = async (toEmail, resetToken) => {
    const resetLink = `${process.env.URL_REACT}/reset-password?token=${resetToken}`; // URL frontend
    let mailOptions = {
        from: '"SmartHR" <your_email@gmail.com>', // Tên thương hiệu + email gửi
        to: toEmail,
        subject: '[SmartHR] Yêu cầu đặt lại mật khẩu tài khoản của bạn',
        text: `Xin chào,\n\nBạn vừa gửi yêu cầu đặt lại mật khẩu cho tài khoản SmartHR của mình.\nVui lòng nhấn vào liên kết sau để đặt lại mật khẩu mới (liên kết này sẽ hết hạn sau 1 giờ):\n\n${resetLink}\n\nNếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này. Mật khẩu của bạn sẽ không bị thay đổi.\n\nCảm ơn bạn đã sử dụng SmartHR.\nĐội ngũ SmartHR`,
        html: `<div style="font-family: Arial, sans-serif; color: #222;">
          <h2 style="color: #1976d2;">Xin chào,</h2>
          <p>Bạn vừa gửi yêu cầu <b>đặt lại mật khẩu</b> cho tài khoản SmartHR của mình.</p>
          <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu mới:</p>
          <div style="margin: 24px 0;">
            <a href="${resetLink}" style="background: #1976d2; color: #fff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;">
              Đặt lại mật khẩu
            </a>
          </div>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này. Mật khẩu của bạn sẽ không bị thay đổi.</p>
          <p style="color: #888; font-size: 13px;">Liên kết này sẽ hết hạn sau 15 phút vì lý do bảo mật.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
          <p style="font-size: 13px; color: #888;">Cảm ơn bạn đã sử dụng SmartHR.<br>Đội ngũ SmartHR</p>
        </div>`
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return { success: true, response: info.response };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
}
export const forgotPasswordService = (email) => new Promise(async (resolve, reject) => {
    try {
        const user = await db.Users.findOne({
            where: { email },
            raw: true
        })
        if (!user) {
            resolve({
                err: 1,
                msg: 'Email is not exist'
            })
        }
        const resetToken = v4()
        // update resetToken và resetTokenExpiry vào database
        await db.Users.update({
            resetToken: resetToken,
            resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000 + 7*60*60*1000) // 15 minutes from now
        }, {
            where: { email }
        })
        const response = await sendResetPasswordEmail(email, resetToken)
        console.log(response)
        resolve({
            err: 0,
            msg: 'New password is sent to email',
            response: response
        })
    } catch (error) {
        reject(error)
    }
})


export const resetPasswordService = (token, newPassword) => new Promise(async (resolve, reject) => {
    try {
        const user = await db.Users.findOne({
            where: {
                resetToken: token,
                resetTokenExpiry: { [db.Sequelize.Op.gt]: new Date() }
            },
            raw: true
        })
        if (!user) {
            resolve({
                err: 1,
                msg: 'Token is expired or not exist'
            })
        }
        await db.Users.update({
            password: hashPassword(newPassword)
        }, {
            where: { resetToken: token }
        })
        resolve({
            err: 0,
            msg: 'Password is updated successfully'
        })
    } catch (error) {
        reject(error)
    }
})

// //GET ALL USERS (with optional search)
export const getAllUsersService = (searchQuery) => new Promise(async (resolve, reject) => {
    try {
        const whereClause = {};
        
        if (searchQuery) {
            whereClause[db.Sequelize.Op.or] = [
                { username: { [db.Sequelize.Op.like]: `%${searchQuery}%` } },
                { email: { [db.Sequelize.Op.like]: `%${searchQuery}%` } }
            ];
        }

        const users = await db.Users.findAll({
            where: whereClause,
            attributes: ['id', 'username', 'email', 'role', 'avatarUrl'],
            order: [['username', 'ASC']],
            limit: 100 // Limit to prevent loading too many users
        });

        resolve({
            err: 0,
            msg: 'OK',
            response: users
        });
    } catch (error) {
        resolve({
            err: 1,
            msg: 'FAILED TO GET USERS: ' + error.message,
            response: []
        });
    }
});

// Admin: create user with random password and specific role
export const adminCreateUserService = (username, email, role = 'Member') => new Promise(async (resolve, reject) => {
    try {
        const existing = await db.Users.findOne({ where: { email } });
        if (existing) {
            return resolve({
                err: 1,
                msg: 'Email đã tồn tại',
            });
        }

        const plainPassword = Math.random().toString(36).slice(-10);
        const user = await db.Users.create({
            id: v4(),
            username,
            email,
            password: hashPassword(plainPassword),
            role,
            mustChangePassword: true,
        });

        resolve({
            err: 0,
            msg: 'Tạo tài khoản thành công',
            response: {
                ...buildPublicUserProfile(user),
                // trả về mật khẩu để Admin gửi cho user
                tempPassword: plainPassword,
            },
        });
    } catch (error) {
        reject(error);
    }
});

export const adminUpdateUserService = (id, data) => new Promise(async (resolve, reject) => {
    try {
        const user = await db.Users.findByPk(id);
        if (!user) {
            return resolve({
                err: 1,
                msg: 'User không tồn tại',
            });
        }

        const allowed = ['username', 'email', 'role'];
        const updatePayload = {};
        allowed.forEach((key) => {
            if (data[key] !== undefined) updatePayload[key] = data[key];
        });

        await user.update(updatePayload);
        await user.reload();

        resolve({
            err: 0,
            msg: 'Cập nhật tài khoản thành công',
            response: buildPublicUserProfile(user),
        });
    } catch (error) {
        reject(error);
    }
});

export const adminDeleteUserService = (id) => new Promise(async (resolve, reject) => {
    try {
        const user = await db.Users.findByPk(id);
        if (!user) {
            return resolve({
                err: 1,
                msg: 'User không tồn tại',
            });
        }
        if (user.avatarPublicId && isCloudinaryConfigured()) {
            configureCloudinary();
            await destroyCloudinaryAsset(user.avatarPublicId);
        }
        await user.destroy();
        resolve({
            err: 0,
            msg: 'Xóa tài khoản thành công',
        });
    } catch (error) {
        reject(error);
    }
});

// First login: user must change password
export const firstChangePasswordService = (id, newPassword) => new Promise(async (resolve, reject) => {
    try {
        const user = await db.Users.findByPk(id);
        if (!user) {
            return resolve({
                err: 1,
                msg: 'User không tồn tại',
            });
        }

        await user.update({
            password: hashPassword(newPassword),
            mustChangePassword: false,
        });

        resolve({
            err: 0,
            msg: 'Đổi mật khẩu lần đầu thành công',
        });
    } catch (error) {
        reject(error);
    }
});

export const getCurrentUserProfileService = (id) =>
    new Promise(async (resolve, reject) => {
        try {
            const user = await db.Users.findByPk(id, {
                attributes: [
                    'id',
                    'username',
                    'email',
                    'role',
                    'avatarUrl',
                    'mustChangePassword',
                    'createdAt',
                    'updatedAt',
                ],
            });
            if (!user) {
                return resolve({
                    err: 1,
                    msg: 'User không tồn tại',
                });
            }
            resolve({
                err: 0,
                msg: 'OK',
                response: buildPublicUserProfile(user),
            });
        } catch (error) {
            reject(error);
        }
    });

// Update current user's profile (currently: username)
export const updateProfileService = (id, data) => new Promise(async (resolve, reject) => {
    try {
        const user = await db.Users.findByPk(id);
        if (!user) {
            return resolve({
                err: 1,
                msg: 'User không tồn tại',
            });
        }

        const updatePayload = {};
        if (data?.username !== undefined) updatePayload.username = data.username;

        if (Object.keys(updatePayload).length === 0) {
            return resolve({
                err: 1,
                msg: 'Không có dữ liệu để cập nhật',
            });
        }

        await user.update(updatePayload);

        await user.reload();
        resolve({
            err: 0,
            msg: 'Cập nhật hồ sơ thành công',
            response: buildPublicUserProfile(user),
        });
    } catch (error) {
        reject(error);
    }
});

export const uploadAvatarService = (userId, file) =>
    new Promise(async (resolve) => {
        try {
            if (!isCloudinaryConfigured()) {
                return resolve({
                    err: 1,
                    msg: 'Chưa cấu hình Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)',
                });
            }
            configureCloudinary();
            if (!file?.buffer) {
                return resolve({ err: 1, msg: 'Thiếu file ảnh' });
            }
            const user = await db.Users.findByPk(userId);
            if (!user) {
                return resolve({ err: 1, msg: 'User không tồn tại' });
            }
            const oldPublicId = user.avatarPublicId;
            const publicId = `user-${userId}-${Date.now()}`;
            const result = await uploadAvatarBuffer(file.buffer, { publicId });
            await user.update({
                avatarUrl: result.secure_url,
                avatarPublicId: result.public_id,
            });
            if (oldPublicId && oldPublicId !== result.public_id) {
                await destroyCloudinaryAsset(oldPublicId);
            }
            await user.reload();
            resolve({
                err: 0,
                msg: 'Cập nhật ảnh đại diện thành công',
                response: buildPublicUserProfile(user),
            });
        } catch (error) {
            resolve({
                err: 1,
                msg: 'Upload ảnh thất bại: ' + (error?.message || error),
            });
        }
    });

export const deleteAvatarService = (userId) =>
    new Promise(async (resolve) => {
        try {
            const user = await db.Users.findByPk(userId);
            if (!user) {
                return resolve({ err: 1, msg: 'User không tồn tại' });
            }
            const oldPublicId = user.avatarPublicId;
            await user.update({ avatarUrl: null, avatarPublicId: null });
            if (oldPublicId && isCloudinaryConfigured()) {
                configureCloudinary();
                await destroyCloudinaryAsset(oldPublicId);
            }
            await user.reload();
            resolve({
                err: 0,
                msg: 'Đã xóa ảnh đại diện',
                response: buildPublicUserProfile(user),
            });
        } catch (error) {
            resolve({
                err: 1,
                msg: 'Xóa ảnh thất bại: ' + (error?.message || error),
            });
        }
    });

// export const verifyEmailService = (email) => new Promise(async (resolve, reject) => {
//     try {
//         const user = await db.Users.findOne({
//             where: { email },
//             raw: true
//         })
//         if (!user) {
//             resolve({
//                 err: 1,
//                 msg: 'Email is not exist'
//             })
//         }
//         resolve({
//             err: 0,
//             msg: 'Email is verified'
//         })
//     } catch (error) {
//         reject(error)
//     }
// })





