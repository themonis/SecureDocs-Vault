// components/AuthProvider.jsx
import React, { useState, useEffect, useCallback } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { authAPI } from "../services/api"; // Make sure you import your api service

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use useCallback to prevent re-creating this function on every render
  const verifyUserToken = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // Ask the backend to verify our token
        const response = await authAPI.verifyToken();
        if (response.data.success) {
          // If the backend says the token is valid, set the user
          console.log("Backend user data:", response.data.user);
          setUser(response.data.user);
          console.log("✅ Token verified by backend, user authenticated.");
        }
      } catch (error) {
        // If the backend says the token is invalid, log the user out
        console.error(
          "❌ Backend token verification failed:",
          error.response?.data?.message || error.message
        );
        localStorage.removeItem("token");
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    verifyUserToken();
  }, [verifyUserToken]);

  const login = (token, userData) => {
    localStorage.setItem("token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
