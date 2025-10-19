import axios, { type AxiosResponse } from "axios";
import qs from "qs";
const service = axios.create({
  baseURL: "neodown",
  timeout: 50000,

  paramsSerializer: (params) => {
    return qs.stringify(params);
  },
});

service.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: any) => {
    return Promise.reject(error.message);
  }
);
export default service;
