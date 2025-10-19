import type { User } from "@/type";
import { createContext, use, useContext, useEffect, useState } from "react";
import { da } from "zod/v4/locales";
import { queryClient } from "./react-query-provider";
import { useLocation, useNavigate } from "react-router";
import { publicRoutes } from "@/lib";
import { set } from "zod";

interface AuthContextType {
      user: User | null;
      isAuthenticated: boolean;  
      isLoading: boolean;
      login: (data: any) => Promise<void>;
      logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);  

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
      const [user, setUser] = useState<User | null>(null);
      const [isAuthenticated, setIsAuthenticated] = useState(false);
      const [isLoading, setIsLoading] = useState(false);

      const navigate = useNavigate();
      const currentPath = useLocation().pathname;
      const isPublicRoute = publicRoutes.includes(currentPath);

      useEffect(() => {
            const checkAuth = async () => {
                  setIsLoading(true);
                  const userInfo = localStorage.getItem("user");
                  if(userInfo) {
                        setUser(JSON.parse(userInfo));
                        setIsAuthenticated(true);
                  }else{
                        setUser(null);
                        setIsAuthenticated(false);
                        if(!isPublicRoute){
                              navigate("/sign-in");
                        }
                  }
                  setIsLoading(false);
            }
            checkAuth();
      }, []);


      useEffect(() => {
            const handleLogout = () => {
                  logout();
                  navigate("/sign-in");
            }
            window.addEventListener("force-logout", handleLogout);
            return () => window.removeEventListener("force-logout", handleLogout);
      }, []);


      const login = async (data: any) => {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.response));

            setUser(data.user);
            setIsAuthenticated(true);
      }
      const logout = async () => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            setUser(null);
            setIsAuthenticated(false);

            queryClient.clear();
      }
      const values = {
            user,
            isAuthenticated,
            isLoading,
            login,
            logout,
      };

      return (
            <AuthContext.Provider value={values}>
                  {children}
            </AuthContext.Provider>
      )
}

export const useAuth = () => {
      const context = useContext(AuthContext);

      if (!context) {
            throw new Error("useAuth must be used within an AuthProvider");
      }
      return context;
}