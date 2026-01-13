// src/features/auth/components/LoginForm.tsx
import { useState } from "react";
import { useLogin } from "../../features/auth/hooks/useLogin";

export const LoginForm = () => {
  const { loginUser, loading, error } = useLogin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        loginUser(username, password);
      }}
    >
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button disabled={loading}>Connexion</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
};
