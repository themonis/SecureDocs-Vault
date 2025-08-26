import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

export default function AuthSuccess() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const effectRan = useRef(false);
  const [loading, setLoading] = useState(true);
  const [avatar, setAvatar] = useState(null); // ✅ Avatar state

  useEffect(() => {
    if (effectRan.current === false) {
      const params = new URLSearchParams(location.search);
      const token = params.get("token");

      if (!token) {
        toast.error("Authentication failed: No token found.");
        navigate("/login");
        return;
      }

      localStorage.setItem("token", token);

      const timeout = setTimeout(() => {
        toast.error("Login taking too long. Please try again.");
        setLoading(false);
      }, 10000); // 10 seconds

      authAPI
        .verifyToken()
        .then((response) => {
          clearTimeout(timeout);
          if (response.data.success) {
            const { user } = response.data;
            login(token, user);
            setAvatar(user.avatar || null); // ✅ Set avatar if available
            toast.success("Successfully logged in with Google!");
            setLoading(false);

            if (user.role === "Admin") navigate("/admin");
            else navigate("/dashboard");
          } else {
            toast.error("Invalid token. Please log in again.");
            navigate("/login");
          }
        })
        .catch((error) => {
          clearTimeout(timeout);
          console.error("Token verification failed:", error);
          toast.error("Login failed. Please try again.");
          navigate("/login");
        });
    }

    return () => {
      effectRan.current = true;
    };
  }, [login, navigate, location]);

  if (!loading) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="text-center">
        {avatar && (
          <img
            src={avatar}
            alt="User Avatar"
            className="h-16 w-16 rounded-full mx-auto mb-4 border-2 border-white/20"
          />
        )}
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg mb-2">Finalizing your login...</p>
        <p className="text-white/60 text-sm">
          Please do not close this window.
        </p>
      </div>
    </div>
  );
}
