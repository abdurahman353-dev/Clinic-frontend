"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { authAPI } from "@/lib/api";

interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  must_change_password?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = Cookies.get("admin_token");
    const isRemembered = localStorage.getItem("admin_remember") === "true";
    const userStr = isRemembered 
      ? localStorage.getItem("admin_user") 
      : sessionStorage.getItem("admin_user");

    if (storedToken) {
      setToken(storedToken);
    }
    
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Failed to parse user from storage", e);
      }
    }
    
    setIsLoading(false);
  }, []);

  const handleSetUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      const isRemembered = localStorage.getItem("admin_remember") === "true";
      if (isRemembered) {
        localStorage.setItem("admin_user", JSON.stringify(newUser));
      } else {
        sessionStorage.setItem("admin_user", JSON.stringify(newUser));
      }
    } else {
      sessionStorage.removeItem("admin_user");
      localStorage.removeItem("admin_user");
    }
  };

  const handleSetToken = (newToken: string | null) => {
    setToken(newToken);
    if (newToken) {
       const isSecure = process.env.NODE_ENV === 'production';
       const isRemembered = localStorage.getItem("admin_remember") === "true";
       const options: any = { secure: isSecure, sameSite: 'lax' };
       if (isRemembered) {
         options.expires = 14;
       }
       Cookies.set('admin_token', newToken, options);
    } else {
      Cookies.remove('admin_token');
    }
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
    setToken(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, token, setUser: handleSetUser, setToken: handleSetToken, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
