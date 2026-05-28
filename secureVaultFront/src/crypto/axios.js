import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:8080",
  withCredentials: true,
});

// request interceptor
api.interceptors.request.use((config) => {
  config.withCredentials = true;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;

    const shouldLogout =
      status === 401 ||
      error?.response?.data === "TOKEN_EXPIRED" ||
      status === 403 ||
      error?.response?.data === "ACCOUNT_FROZEN"
      ;

    if (shouldLogout) {

      localStorage.clear();
      sessionStorage.clear();
      window.dispatchEvent(new Event("auth:logout"));
      window.location.replace("/");
    }

    return Promise.reject(error);
  }
);


export default api;