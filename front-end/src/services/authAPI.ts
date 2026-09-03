import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

export type AuthRequest = {
  name?: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  user: {
    name: string;
    email: string;
    role?: string;
  };
  token: string;
};

export type ForgotPasswordRequest = {
  email: string;
  newPassword: string;
};

export const loginUser = async (payload: AuthRequest) => {
  const response = await api.post<AuthResponse>("/auth/login", payload);
  return response.data;
};


export const registerUser = async (payload: AuthRequest) => {
  const response = await api.post<AuthResponse>("/auth/register", payload);
  return response.data;
};


export const forgetPasswordUser = async (payload: ForgotPasswordRequest) => {
  const response = await api.patch<{ message: string }>(
    "/auth/forgetPassword",
    payload,
  );
  return response.data;
};