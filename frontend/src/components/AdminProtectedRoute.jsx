import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth"; // Adjusted path for components folder

export default function AdminProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    // You can replace this with your loading spinner component
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  // Check if user is logged in AND their role is 'Admin'
  if (user && user.role === "Admin") {
    return children;
  }

  // If not an Admin, redirect them away from the admin page
  return <Navigate to="/dashboard" replace />;
}
