import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AuthProvider from "./components/AuthProvider";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ProfilePage from "./pages/ProfilePage";
import { useAuth } from "./hooks/useAuth";

// Pages
import Login from "./pages/Login";
import Signup from "./pages/SignUp";
import AuthSuccess from "./pages/AuthSuccess";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import Analytics from "./pages/Analytics";
import AdminDashboard from "./pages/AdminDashboard";
import GuestLanding from "./pages/GuestLanding";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";

// ✅ NEW: Component to handle authenticated user redirects
function AuthRedirectHandler({ children }) {
  const { user } = useAuth();

  // If user is authenticated and tries to access login/signup, handle appropriately
  if (
    user &&
    (window.location.pathname === "/login" ||
      window.location.pathname === "/signup")
  ) {
    if (user.role === "Guest") {
      // Allow Guests to access login/signup pages (they might want to log out or switch accounts)
      return children;
    } else {
      // Redirect Users/Authors to dashboard
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* ✅ UPDATED: Public routes with auth redirect handling */}
          <Route
            path="/login"
            element={
              <AuthRedirectHandler>
                <Login />
              </AuthRedirectHandler>
            }
          />

          <Route
            path="/signup"
            element={
              <AuthRedirectHandler>
                <Signup />
              </AuthRedirectHandler>
            }
          />

          {/* ✅ Other public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* ✅ Guest Landing Route - Allow Guests to access */}
          <Route
            path="/guest-landing"
            element={
              <ProtectedRoute allowedRoles={["Guest"]}>
                <GuestLanding />
              </ProtectedRoute>
            }
          />

          {/* ✅ Role Request Route - Allow Guests to access */}
          <Route
            path="/role-request"
            element={
              <ProtectedRoute allowedRoles={["Guest"]}>
                <GuestLanding />
              </ProtectedRoute>
            }
          />

          {/* ✅ Protected routes for Users/Authors/Admins */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["User", "Author", "Admin"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute
                allowedRoles={["User", "Author", "Admin", "Guest"]}
              >
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* ✅ Analytics restricted to Authors & Admins only */}
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={["Author", "Admin"]}>
                <Analytics />
              </ProtectedRoute>
            }
          />

          {/* ✅ Admin routes */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
