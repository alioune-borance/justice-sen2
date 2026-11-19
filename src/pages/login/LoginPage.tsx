import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/store/auth.store";
import { LoginForm } from "../../components/auth/LoginForm";
import { NoticeBanner } from "../../shared/notifications/NoticeBanner";

export const LoginPage = () => {
  const token = useAuthStore((s) => s.accessToken);

  if (token) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500">
      {/* « Session expirée » après un 401 non récupérable */}
      <div className="w-full max-w-md px-4">
        <NoticeBanner />
      </div>
      <LoginForm />
    </div>
  );
};
