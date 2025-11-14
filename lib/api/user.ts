import {useFetch} from "./fetch-client";

export const useUserApi = () => {
  const {postData, patchData} = useFetch();

  const sendVerificationCode = async (email: string) => {
    return await postData("/api/user/sendVerificationCode/", {email});
  };

  const verifyCode = async (email: string, code: string) => {
    return await postData("/api/user/verifyCode/", {email, code});
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

  const signin = async (email: string, password: string) => {
    return await postData("/api/user/signin/", {email, password});
  };

  const verifyToken = async (access: string) => {
    return await postData("/api/token/verify/", {token: access});
  };

  const refreshToken = async (refresh: string) => {
    return await postData("/api/token/refresh/", {refresh});
  };

  const updateProfile = async (token: string, fields: any) => {
    return await patchData("/api/user/updateProfile/", fields, token);
  };

  return {
    sendVerificationCode,
    verifyCode,
    signup,
    signin,
    verifyToken,
    refreshToken,
    updateProfile,
  };
};
