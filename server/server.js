import './src/loadEnv'
const emailExistence = require('email-existence');
// Import các thư viện cần thiết
import express from 'express'
import cors from 'cors'      
import cookieParser from 'cookie-parser'
import connectDatabase from './src/config/connectDatabase'
import initRoutes from './src/routers'


const app = express()
const PORT = process.env.PORT || 5000
//cho phép các request từ các domain khác (ví dụ: frontend của bạn) có thể truy cập API của backend
app.use(cors({
    origin: process.env.URL_REACT,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true, //  cho phép trình duyệt gửi và nhận thông tin xác thực Cookie ,Authorization headers
}))

//giúp có thể đọc giữ liệu được gửi lên từ client
app.use(express.json())
// đđể backend nhận được dữ liệu dạng x-www-form-urlencoded,
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

connectDatabase();
initRoutes(app);



// emailExistence.check('phanthanhthang1104@gmail.com', (err, res) => {
//   if (err) {
//     console.error('Error:', err);
//   } else {
//     console.log('Email exists:', res); // true nếu email tồn tại
//   }
// });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`Server is running on http://localhost:${PORT}`)
})
