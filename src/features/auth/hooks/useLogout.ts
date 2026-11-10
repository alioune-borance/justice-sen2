import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutSession } from "../session";

export const useLogout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const logoutUser = useCallback(async () => {
    setLoading(true);
    await logoutSession();
    setLoading(false);
    navigate("/login", { replace: true });
  }, [navigate]);

  return { logoutUser, loading };
};
