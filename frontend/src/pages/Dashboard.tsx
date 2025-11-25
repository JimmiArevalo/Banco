import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  createProduct,
  deposit,
  listProducts,
  withdraw,
} from "../services/api";
import { Product } from "../types";

export function DashboardPage() {
  const { client, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: listProducts,
  });

  const [productForm, setProductForm] = useState({
    productType: "Cuenta de ahorros",
    alias: "",
    currency: "COP",
  });

  const createMutation = useMutation({
    mutationFn: () => createProduct(productForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setProductForm((prev) => ({ ...prev, alias: "" }));
    },
  });

  useEffect(() => {
    if (!client) {
      navigate("/login");
    }
  }, [client, navigate]);

  if (!client) return null;

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <p className="muted">Bienvenido</p>
          <h2>{client.full_name}</h2>
          <p className="muted">{client.email}</p>
        </div>
        <button className="ghost" onClick={logout}>
          Cerrar sesión
        </button>
      </header>

      <section className="card">
        <h3>Crear producto</h3>
        <form
          className="form"
          onSubmit={(evt) => {
            evt.preventDefault();
            createMutation.mutate();
          }}
        >
          <label>
            Tipo
            <select
              value={productForm.productType}
              onChange={(evt) =>
                setProductForm((prev) => ({
                  ...prev,
                  productType: evt.target.value,
                }))
              }
            >
              <option>Cuenta de ahorros</option>
              <option>Cuenta corriente</option>
              <option>CDT</option>
            </select>
          </label>
          <label>
            Alias
            <input
              value={productForm.alias}
              onChange={(evt) =>
                setProductForm((prev) => ({
                  ...prev,
                  alias: evt.target.value,
                }))
              }
              placeholder="Universidad, Ahorro moto..."
            />
          </label>
          <label>
            Moneda
            <select
              value={productForm.currency}
              onChange={(evt) =>
                setProductForm((prev) => ({
                  ...prev,
                  currency: evt.target.value,
                }))
              }
            >
              <option value="COP">COP</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <button type="submit" disabled={createMutation.isLoading}>
            {createMutation.isLoading ? "Creando..." : "Guardar"}
          </button>
          {createMutation.isError && (
            <p className="error">No se pudo crear el producto.</p>
          )}
        </form>
      </section>

      <section>
        <h3>Mis productos</h3>
        {productsQuery.isLoading && <p>Cargando...</p>}
        {productsQuery.isError && (
          <p className="error">Error al obtener los productos.</p>
        )}
        <div className="product-grid">
          {productsQuery.data?.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onUpdate={() =>
                queryClient.invalidateQueries({ queryKey: ["products"] })
              }
            />
          ))}
          {!productsQuery.isLoading &&
            productsQuery.data &&
            productsQuery.data.length === 0 && (
              <p>No tienes productos aún.</p>
            )}
        </div>
      </section>
    </div>
  );
}

function ProductCard({
  product,
  onUpdate,
}: {
  product: Product;
  onUpdate: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const depositMutation = useMutation({
    mutationFn: () =>
      deposit(product.id, { amount: Number(amount), description }),
    onSuccess: () => {
      setAmount("");
      setDescription("");
      onUpdate();
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: () =>
      withdraw(product.id, { amount: Number(amount), description }),
    onSuccess: () => {
      setAmount("");
      setDescription("");
      onUpdate();
    },
  });

  const disabled = depositMutation.isLoading || withdrawMutation.isLoading;

  return (
    <div className="product-card">
      <p className="muted">{product.product_type}</p>
      <h4>{product.alias || product.account_number}</h4>
      <p className="balance">
        {product.currency} {product.balance.toLocaleString()}
      </p>
      <p className="muted">Cuenta #{product.account_number}</p>

      <form
        className="form"
        onSubmit={(evt) => {
          evt.preventDefault();
        }}
      >
        <label>
          Valor
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(evt) => setAmount(evt.target.value)}
            placeholder="500000"
            required
          />
        </label>
        <label>
          Nota (opcional)
          <input
            value={description}
            onChange={(evt) => setDescription(evt.target.value)}
            placeholder="Paga nómina"
          />
        </label>
        <div className="actions">
          <button
            type="button"
            disabled={disabled}
            onClick={() => depositMutation.mutate()}
          >
            Consignar
          </button>
          <button
            type="button"
            className="ghost"
            disabled={disabled}
            onClick={() => withdrawMutation.mutate()}
          >
            Retirar
          </button>
        </div>
        {(depositMutation.isError || withdrawMutation.isError) && (
          <p className="error">No se pudo completar la operación.</p>
        )}
      </form>
    </div>
  );
}

