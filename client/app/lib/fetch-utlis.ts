import axios from "axios";
import { tr } from "zod/v4/locales";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

//Trước khi gửi request, lấy token từ localStorage. Nếu có token, thêm vào header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; //Bearer ${token}`;
  }
  return config;
});


//Được gọi sau khi server trả về kết quả.Nếu server trả về lỗi 401 (Unauthorized) → nghĩa là token không hợp lệ hoặc hết hạn.
//Gửi sự kiện force-logout cho toàn app,để những component khác bắt được và logout người dùng tự động.
api.interceptors.response.use( (response) => response, (error) => {
      if(error.response && error.response.status === 401) {
            window.dispatchEvent(new Event("force-logout"));
      }
      return Promise.reject(error);
})


const postData = async <T>(path: string, data?: any): Promise<T> => {
      try {
            // console.log(data)
            const response = await api.post(path, data);
            return response.data;
      } catch (error) {
            throw error;
      }
}

const fetchData = async <T>(path: string, data?: any): Promise<T> => {
      try {
            const response = await api.get(path, data);
            return response.data;
      } catch (error) {
            throw error;
      }
}

const updateData = async <T>(path: string, data?: any): Promise<T> => {
      try {
            const response = await api.put(path, data);
            return response.data;
      } catch (error) {
            throw error;
      }
}

const deleteData = async <T>(path: string, data?: any): Promise<T> => {
      try {
            const response = await api.delete(path, data);
            return response.data;
      } catch (error) {
            throw error;
      }
}

export { postData, fetchData, updateData, deleteData };