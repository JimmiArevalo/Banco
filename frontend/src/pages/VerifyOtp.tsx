import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { verifyOtp } from "../services/api";

export function VerifyOtpPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const loginToken = params.get("token") ?? "";

  const [code, setCode] = useState("");

  const mutation = useMutation({
    mutationFn: () => verifyOtp({ loginToken, code }),
    onSuccess: ({ accessToken, client }) => {
      setSession(accessToken, client);
      navigate("/dashboard");
    },
  });

  const onSubmit = (evt: React.FormEvent) => {
    evt.preventDefault();
    mutation.mutate();
  };

  if (!loginToken) {
    return <p>El token de inicio de sesión no es válido.</p>;
  }

  return (
    <>
      <form className="form" onSubmit={onSubmit}>
        <label>
          Código 2FA
          <input
            value={code}
            required
            minLength={6}
            maxLength={6}
            onChange={(evt) => setCode(evt.target.value)}
            placeholder="123456"
          />
        </label>
        <button type="submit" disabled={mutation.isLoading}>
          {mutation.isLoading ? "Validando..." : "Verificar"}
        </button>
        {mutation.isError && (
          <p className="error">Código incorrecto o expirado.</p>
        )}
      </form>
      <p>Abre tu app Authenticator para generar el código temporal.</p>
    </>
  );
}

