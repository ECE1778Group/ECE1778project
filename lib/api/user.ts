// lib/api/user.ts
import { useFetch } from "./fetch-client";

export const useUserApi = () => {
  const { postData } = useFetch();

  const sendVerificationCode = async (email: string) => {
    return await postData("/api/user/sendVerificationCode/", { email });
  };

  const verifyCode = async (email: string, code: string) => {
    return await postData("/api/user/verifyCode/", { email, code });
  };

  const signup = async (userData: {
    username: string;
    password: string;
    email: string;
    first_name: string;
    last_name: string;
  }) => {
    return await postData("/api/user/signup/", userData);
  };

  const signin = async (username: string, password: string) => {
    return await postData("/api/user/signin/", { username, password });
  };

  return {
    sendVerificationCode,
    verifyCode,
    signup,
    signin,
  };
};