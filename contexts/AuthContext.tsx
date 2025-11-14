import React, {createContext, useContext, useEffect, useMemo, useRef, useState,} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useUserApi} from "../lib/api/user";
import {IUser} from "../interfaces/User.interface";

/* ========================================================
   Dummy user (初始空用户对象)
======================================================== */
export const dummyUser: IUser = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  userId: "",
};

interface AuthContextType {
  loggedIn: boolean;
  user: IUser;
  isAuthLoading: boolean;
  isLoggingOut: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyAuth: () => Promise<{ isAuthenticated: boolean; user?: IUser }>;
  updateUser: (fields: Partial<IUser>) => void;
  skip: () => void;
}

const AuthContext = createContext<AuthContextType>({
  loggedIn: false,
  user: dummyUser,
  isAuthLoading: true,
  isLoggingOut: false,
  login: async () => {
  },
  logout: async () => {
  },
  verifyAuth: async () => ({isAuthenticated: false}),
  updateUser: () => {
  },
  skip: () => {
  },
});

export const AuthProvider = ({children}: { children: React.ReactNode }) => {
  const {signin, verifyToken, refreshToken, updateProfile} = useUserApi();

  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<IUser>(dummyUser);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const authCheckedRef = useRef(false);

  const login = async (email: string, password: string) => {
    try {
      setIsAuthLoading(true);
      const res = await signin(email, password);
      console.log(res)
      if (res?.access && res?.refresh && res?.user) {
        await AsyncStorage.setItem("access", res.access);
        await AsyncStorage.setItem("refresh", res.refresh);
        await AsyncStorage.setItem("user", JSON.stringify(res.user));

        setUser(res.user);
        setLoggedIn(true);
      } else {
        throw new Error("Invalid login response");
      }
    } catch (err) {
      throw err;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoggingOut(true);
      await AsyncStorage.multiRemove(["access", "refresh", "user"]);
      setUser(dummyUser);
      setLoggedIn(false);
    } finally {
      setIsLoggingOut(false);
    }
  };


  const verifyAuth = async () => {
    try {
      setIsAuthLoading(true);

      const access = await AsyncStorage.getItem("access");
      const refresh = await AsyncStorage.getItem("refresh");
      const storedUser = await AsyncStorage.getItem("user");

      if (!access || !refresh || !storedUser) {
        setLoggedIn(false);
        setUser(dummyUser);
        return {isAuthenticated: false};
      }

      const verifyRes = await verifyToken(access);
      if (verifyRes && verifyRes.status === 200) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setLoggedIn(true);
        return {isAuthenticated: true, user: parsedUser};
      }

      const refreshRes = await refreshToken(refresh);
      if (refreshRes?.access) {
        await AsyncStorage.setItem("access", refreshRes.access);
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setLoggedIn(true);
        return {isAuthenticated: true, user: parsedUser};
      }

      await AsyncStorage.multiRemove(["access", "refresh", "user"]);
      setUser(dummyUser);
      setLoggedIn(false);
      return {isAuthenticated: false};
    } catch (err) {
      setUser(dummyUser);
      setLoggedIn(false);
      return {isAuthenticated: false};
    } finally {
      setIsAuthLoading(false);
    }
  };


  const updateUser = (fields: Partial<IUser>) => {
    setUser((prev) => {
      const updated = {...prev, ...fields};
      AsyncStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  /* ========================================================
     游客模式 (skip)
  ======================================================== */
  const skip = () => {
    setLoggedIn(true);
    setUser({
      username: "Guest",
      email: "",
      first_name: "Guest",
      last_name: "",
      userId: "guest",
    });
  };

  useEffect(() => {
    if (!authCheckedRef.current) {
      authCheckedRef.current = true;
      verifyAuth();
    }
  }, []);

  const value = useMemo(
    () => ({
      loggedIn,
      user,
      isAuthLoading,
      isLoggingOut,
      login,
      logout,
      verifyAuth,
      updateUser,
      skip,
    }),
    [loggedIn, user, isAuthLoading, isLoggingOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
