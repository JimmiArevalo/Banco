import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginStepOne } from "../services/api";

export function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const mutation = useMutation({
    mutationFn: () => loginStepOne(form),
    onSuccess: (data) => {
      navigate(`/verificar?token=${data.loginToken}`);
    },
  });

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [evt.target.name]: evt.target.value }));
  };

  const onSubmit = (evt: React.FormEvent) => {
    evt.preventDefault();
    mutation.mutate();
  };

  return (
    <>
      <form onSubmit={onSubmit} className="form">
        <label>
          Correo
          <input
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="ana@correo.com"
          />
        </label>
        <label>
          Contraseña
          <input
            name="password"
            type="password"
            required
            value={form.password}
            onChange={handleChange}
          />
        </label>
        <button type="submit" disabled={mutation.isLoading}>
          {mutation.isLoading ? "Verificando..." : "Continuar"}
        </button>
        {mutation.isError && (
          <p className="error">Revisa tus credenciales e inténtalo de nuevo.</p>
        )}
      </form>
      <p>
        ¿Sin cuenta? <Link to="/registro">Regístrate</Link>
      </p>
    </>
  );
}

