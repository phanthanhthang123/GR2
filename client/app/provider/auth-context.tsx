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
            try {
                  // Store token and user data
                  localStorage.setItem("token", data.token);
                  const userData = data.response || data.user;
                  localStorage.setItem("user", JSON.stringify(userData));

                  // Update state synchronously first
                  setUser(userData);
                  setIsAuthenticated(true);

                  // Wait a bit for state to update
                  await new Promise(resolve => setTimeout(resolve, 50));

                  // Invalidate all queries to refetch fresh data
                  queryClient.invalidateQueries();
                  
                  // Refetch critical queries
                  const userId = userData?.id;
                  if (userId) {
                        queryClient.invalidateQueries({
                              queryKey: ["workspaces", userId],
                        });
                        queryClient.invalidateQueries({
                              queryKey: ["workspace"],
                        });
                  }
            } catch (error) {
                  console.error("Login error:", error);
                  throw error;
            }
      }
      const logout = async () => {
            try {
                  // Clear state first
                  setUser(null);
                  setIsAuthenticated(false);
                  
                  // Clear localStorage
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  localStorage.removeItem("selectedWorkspaceId");

                  // Clear query cache
                  queryClient.clear();
            } catch (error) {
                  console.error("Logout error:", error);
            }
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