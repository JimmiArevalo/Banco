import { Navigate, Route, Routes } from "react-router-dom";
import { AuthLayout } from "./components/AuthLayout";
import { AuthProvider } from "./contexts/AuthContext";
import { DashboardPage } from "./pages/Dashboard";
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { VerifyOtpPage } from "./pages/VerifyOtp";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/registro"
          element={
            <AuthLayout title="Crear cliente">
              <RegisterPage />
            </AuthLayout>
          }
        />
        <Route
          path="/login"
          element={
            <AuthLayout title="Ingresa a tu cuenta">
              <LoginPage />
            </AuthLayout>
          }
        />
        <Route
          path="/verificar"
          element={
            <AuthLayout title="Segundo factor">
              <VerifyOtpPage />
            </AuthLayout>
          }
        />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<p>Ruta no encontrada</p>} />
      </Routes>
    </AuthProvider>
  );
}

