// src/features/auth/components/LoginForm.tsx
import { useState } from "react";
import { useLogin } from "../../features/auth/hooks/useLogin";
import { Shield, User, Lock, Eye, EyeOff } from "lucide-react";

export const LoginForm = () => {
  const { loginUser, loading, error } = useLogin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-md mx-4">
      {/* Card */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-10 pb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Système de Gestion</h1>
          <p className="text-blue-200 text-sm mt-1">Administration pénitentiaire</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/20 mx-8" />

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loginUser(username, password);
          }}
          className="px-8 py-8 space-y-5"
        >
          {/* Username */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-blue-100">
              Nom d'utilisateur
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300" />
              <input
                type="text"
                placeholder="Entrez votre identifiant"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-white/10 border border-white/25 text-white placeholder-blue-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-blue-100">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/10 border border-white/25 text-white placeholder-blue-300 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/20 border border-red-400/40 rounded-lg px-4 py-2.5">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-blue-700 font-semibold py-2.5 rounded-lg text-sm hover:bg-blue-50 active:bg-blue-100 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-md mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                Connexion en cours…
              </span>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="px-8 pb-6 text-center">
          <p className="text-blue-300 text-xs">
            Accès réservé au personnel autorisé
          </p>
        </div>
      </div>

      {/* Bottom label */}
      <p className="text-center text-blue-300/60 text-xs mt-6">
        © {new Date().getFullYear()} — Administration pénitentiaire
      </p>
    </div>
  );
};
