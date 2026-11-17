import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { storeApi, type OrderSummary } from "../lib/api";

export const Route = createFileRoute("/track")({
  component: TrackOrderPage,
});

function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<OrderSummary>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incomingOrderNumber = params.get("orderNumber");
    if (incomingOrderNumber) {
      setOrderNumber(incomingOrderNumber);
      void lookup(incomingOrderNumber);
    }
  }, []);

  async function lookup(value: string) {
    setError("");
    setOrder(undefined);
    setLoading(true);
    try {
      setOrder(await storeApi.trackOrder(value.trim()));
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : "Could not find that order.");
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void lookup(orderNumber);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <div className="mx-auto max-w-xl">
        <Link to="/" className="text-sm font-bold text-primary hover:underline">
          ← Back to XeleX
        </Link>
        <h1 className="mt-5 text-4xl font-extrabold">Track your order</h1>
        <form onSubmit={submit} className="mt-6 flex gap-2 rounded-2xl border bg-card p-3">
          <input
            required
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value)}
            placeholder="Enter your order number"
            className="min-w-0 flex-1 rounded-xl bg-background px-4 py-3"
          />
          <button
            disabled={loading}
            className="rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground disabled:opacity-60"
          >
            {loading ? "Checking…" : "Track"}
          </button>
        </form>
        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}
        {order && (
          <section className="mt-6 rounded-2xl border bg-card p-6">
            <p className="text-sm text-muted-foreground">Order number</p>
            <p className="font-mono text-lg font-bold">{order.orderNumber}</p>
            <p className="mt-5 text-sm text-muted-foreground">Order status</p>
            <p className="mt-1 text-2xl font-extrabold capitalize">
              {order.status.replaceAll("_", " ")}
            </p>
            <p className="mt-3 text-sm">
              Payment: <span className="font-semibold capitalize">{order.paymentStatus}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Placed {new Date(order.createdAt).toLocaleString()}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
