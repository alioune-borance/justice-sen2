import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/store/auth.store";
import { LoginForm } from "../../components/auth/LoginForm";

export const LoginPage = () => {
  const token = useAuthStore((s) => s.accessToken);

  if (token) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoginForm />
    </div>
  );
};
