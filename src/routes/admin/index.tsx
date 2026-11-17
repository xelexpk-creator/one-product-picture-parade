import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  adminApi,
  formatPKR,
  storeApi,
  type AdminOrder,
  type PaymentOptions,
  type PriceDetails,
  type VoucherInfo,
} from "../../lib/api";

export const Route = createFileRoute("/admin/")({
  component: AdminPage,
});

function isOnlinePayment(method: AdminOrder["paymentMethod"]): boolean {
  return ["ONLINE", "online", "CARD", "stripe"].includes(method);
}

function paymentMethodLabel(method: AdminOrder["paymentMethod"]): string {
  return isOnlinePayment(method) ? "Pay Online" : "Cash on delivery";
}

const ORDER_STATUSES = ["placed", "confirmed", "out_for_delivery", "delivered", "cancelled"];

function AdminPage() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderPage, setOrderPage] = useState(1);
  const [vouchers, setVouchers] = useState<VoucherInfo[]>([]);
  const [price, setPrice] = useState<PriceDetails>();
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [paymentOptions, setPaymentOptions] = useState<PaymentOptions>();
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherType, setVoucherType] = useState<"fixed" | "percentage">("fixed");
  const [voucherAmount, setVoucherAmount] = useState(500);
  const [voucherMaxUses, setVoucherMaxUses] = useState(100);
  const [voucherMinimum, setVoucherMinimum] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadDashboard(adminToken: string, pageNumber = 1) {
    setError("");
    try {
      const [orderResult, voucherResult, priceResult, deliveryResult, methods] = await Promise.all([
        adminApi.getOrders(adminToken, pageNumber),
        adminApi.getVouchers(adminToken),
        storeApi.getPrice(),
        storeApi.getDelivery(),
        storeApi.getPaymentOptions(),
      ]);
      setOrders(orderResult.items);
      setOrderTotal(orderResult.total);
      setOrderPage(pageNumber);
      setVouchers(voucherResult.items);
      setPrice(priceResult);
      setDeliveryCharge(deliveryResult.deliveryCharge);
      setPaymentOptions(methods);
    } catch (loadError) {
      const text = loadError instanceof Error ? loadError.message : "Could not load admin data.";
      setError(text);
      if (text.includes("token") || text.includes("authentication")) {
        localStorage.removeItem("xelex_admin_token");
        setToken("");
      }
    }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem("xelex_admin_token");
    if (savedToken) {
      setToken(savedToken);
      void loadDashboard(savedToken);
    }
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await adminApi.login(email, password);
      localStorage.setItem("xelex_admin_token", result.token);
      setToken(result.token);
      setPassword("");
      await loadDashboard(result.token);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Admin login failed.");
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    localStorage.removeItem("xelex_admin_token");
    setToken("");
    setOrders([]);
  }

  async function saveOrderStatus(id: string, status: string) {
    if (!token) return;
    setError("");
    try {
      await adminApi.updateOrderStatus(token, id, status);
      setMessage("Order status updated.");
      await loadDashboard(token, orderPage);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update order.");
    }
  }

  async function createVoucher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await adminApi.createVoucher(token, {
        code: voucherCode,
        type: voucherType,
        amount: voucherAmount,
        maxUses: voucherMaxUses,
        minimumOrderAmount: voucherMinimum,
      });
      setVoucherCode("");
      setMessage("Voucher created.");
      await loadDashboard(token, orderPage);
    } catch (voucherError) {
      setError(voucherError instanceof Error ? voucherError.message : "Could not create voucher.");
    } finally {
      setBusy(false);
    }
  }

  async function savePrices(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !price) return;
    setError("");
    try {
      const result = await adminApi.updatePrice(token, price);
      setPrice(result);
      setMessage("Prices saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save prices.");
    }
  }

  async function saveDelivery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setError("");
    try {
      const result = await adminApi.updateDelivery(token, deliveryCharge);
      setDeliveryCharge(result.deliveryCharge);
      setMessage("Delivery charge saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save delivery.");
    }
  }

  async function savePaymentOptions() {
    if (!token || !paymentOptions) return;
    setError("");
    try {
      const codEnabled = paymentOptions.methods.find((item) => item.id === "cod")?.enabled ?? false;
      const onlineEnabled =
        paymentOptions.methods.find((item) => item.id === "online")?.enabled ?? false;
      const result = await adminApi.updatePaymentOptions(token, { codEnabled, onlineEnabled });
      setPaymentOptions(result);
      setMessage("Payment options saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save payment options.");
    }
  }

  async function toggleVoucher(voucher: VoucherInfo) {
    if (!token) return;
    setError("");
    try {
      await adminApi.updateVoucher(token, voucher._id, { active: !voucher.active });
      await loadDashboard(token, orderPage);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update voucher.");
    }
  }

  if (!token) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
        <form onSubmit={login} className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-sm">
          <Link to="/" className="text-sm font-bold text-primary hover:underline">
            ← XeleX storefront
          </Link>
          <h1 className="mt-5 text-3xl font-extrabold">Admin sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to manage orders, discounts, and store settings.
          </p>
          <label className="mt-6 grid gap-2 text-sm font-semibold">
            Email
            <input
              required
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-xl border bg-background px-4 py-3 font-normal"
            />
          </label>
          <label className="mt-4 grid gap-2 text-sm font-semibold">
            Password
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-xl border bg-background px-4 py-3 font-normal"
            />
          </label>
          {error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          )}
          <button
            disabled={busy}
            className="mt-6 w-full rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link to="/" className="text-sm font-bold text-primary hover:underline">
              ← Storefront
            </Link>
            <h1 className="mt-2 text-3xl font-extrabold">Store administration</h1>
          </div>
          <button
            onClick={signOut}
            className="rounded-xl border px-4 py-2 text-sm font-bold hover:bg-secondary"
          >
            Sign out
          </button>
        </header>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-destructive/10 p-4 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="mt-5 rounded-xl bg-secondary p-4 text-sm">
            {message}
          </p>
        )}

        <section className="mt-8 rounded-3xl border bg-card p-5 sm:p-7">
          <h2 className="text-2xl font-bold">
            Orders{" "}
            <span className="text-base font-normal text-muted-foreground">({orderTotal})</span>
          </h2>
          {orders.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No orders found.</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-muted-foreground">
                    <th className="p-3">Order</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Items / total</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3">Placed</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="border-b align-top">
                      <td className="p-3 font-mono font-bold">{order.orderNumber}</td>
                      <td className="max-w-64 p-3">
                        <strong>{order.customer.fullName}</strong>
                        <br />
                        {order.customer.phone}
                        {order.customer.alternatePhone && (
                          <>
                            <br />
                            Alt: {order.customer.alternatePhone}
                          </>
                        )}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {order.customer.address}
                        </span>
                      </td>
                      <td className="p-3">
                        {order.quantity} × {formatPKR(order.subtotal / order.quantity)}
                        <br />
                        <strong>{formatPKR(order.total)}</strong>
                        {order.voucherCode && (
                          <>
                            <br />
                            <span className="text-xs text-green-700">
                              {order.voucherCode}: −{formatPKR(order.voucherDiscount)}
                            </span>
                          </>
                        )}
                      </td>
                      <td className="p-3">
                        {paymentMethodLabel(order.paymentMethod)}
                        <br />
                        <span className="text-xs text-muted-foreground">{order.paymentStatus}</span>
                        {isOnlinePayment(order.paymentMethod) &&
                          (order.paymentScreenshot ? (
                            <a
                              href={order.paymentScreenshot}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 block w-fit"
                              title="Open payment screenshot"
                            >
                              <img
                                src={order.paymentScreenshot}
                                alt={`Payment screenshot for ${order.orderNumber}`}
                                className="h-20 w-20 rounded-lg border object-cover"
                              />
                              <span className="text-xs font-semibold text-primary underline">
                                View screenshot
                              </span>
                            </a>
                          ) : (
                            <span className="mt-2 block text-xs text-muted-foreground">
                              No screenshot
                            </span>
                          ))}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <select
                          aria-label={`Status for ${order.orderNumber}`}
                          value={order.status}
                          onChange={(event) => void saveOrderStatus(order._id, event.target.value)}
                          className="rounded-lg border bg-background px-2 py-2 capitalize"
                        >
                          {(ORDER_STATUSES.includes(order.status)
                            ? ORDER_STATUSES
                            : [order.status, ...ORDER_STATUSES]
                          ).map((status) => (
                            <option key={status} value={status}>
                              {status.replaceAll("_", " ")}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {orderTotal > 25 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span>
                Page {orderPage} of {Math.ceil(orderTotal / 25)}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={orderPage <= 1}
                  onClick={() => void loadDashboard(token, orderPage - 1)}
                  className="rounded-lg border px-3 py-2 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={orderPage >= Math.ceil(orderTotal / 25)}
                  onClick={() => void loadDashboard(token, orderPage + 1)}
                  className="rounded-lg border px-3 py-2 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border bg-card p-5 sm:p-7">
            <h2 className="text-2xl font-bold">Discount vouchers</h2>
            <form onSubmit={createVoucher} className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold sm:col-span-2">
                Code
                <input
                  required
                  minLength={3}
                  value={voucherCode}
                  onChange={(event) => setVoucherCode(event.target.value.toUpperCase())}
                  className="rounded-xl border bg-background px-3 py-2 font-normal"
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Discount type
                <select
                  value={voucherType}
                  onChange={(event) => setVoucherType(event.target.value as "fixed" | "percentage")}
                  className="rounded-xl border bg-background px-3 py-2 font-normal"
                >
                  <option value="fixed">Fixed PKR</option>
                  <option value="percentage">Percent</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Amount
                <input
                  required
                  type="number"
                  min={1}
                  max={voucherType === "percentage" ? 100 : undefined}
                  value={voucherAmount}
                  onChange={(event) => setVoucherAmount(Number(event.target.value))}
                  className="rounded-xl border bg-background px-3 py-2 font-normal"
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Total uses allowed
                <input
                  required
                  type="number"
                  min={1}
                  value={voucherMaxUses}
                  onChange={(event) => setVoucherMaxUses(Number(event.target.value))}
                  className="rounded-xl border bg-background px-3 py-2 font-normal"
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Minimum order (PKR)
                <input
                  required
                  type="number"
                  min={0}
                  value={voucherMinimum}
                  onChange={(event) => setVoucherMinimum(Number(event.target.value))}
                  className="rounded-xl border bg-background px-3 py-2 font-normal"
                />
              </label>
              <button
                disabled={busy}
                className="rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground sm:col-span-2 disabled:opacity-60"
              >
                Create voucher
              </button>
            </form>
            <div className="mt-6 divide-y">
              {vouchers.map((voucher) => (
                <div
                  key={voucher._id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <strong>{voucher.code}</strong> ·{" "}
                    {voucher.type === "fixed" ? formatPKR(voucher.amount) : `${voucher.amount}%`} ·{" "}
                    {voucher.usedCount}/{voucher.maxUses} uses
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {voucher.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <button
                    onClick={() => void toggleVoucher(voucher)}
                    className="rounded-lg border px-3 py-2 text-xs font-bold"
                  >
                    {voucher.active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="grid content-start gap-6">
            <form onSubmit={savePrices} className="rounded-3xl border bg-card p-5 sm:p-7">
              <h2 className="text-2xl font-bold">Product pricing</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-semibold">
                  Original price (PKR)
                  <input
                    required
                    type="number"
                    min={1}
                    value={price?.originalPrice ?? ""}
                    onChange={(event) =>
                      setPrice((current) =>
                        current
                          ? { ...current, originalPrice: Number(event.target.value) }
                          : current,
                      )
                    }
                    className="rounded-xl border bg-background px-3 py-2 font-normal"
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Selling price (PKR)
                  <input
                    required
                    type="number"
                    min={1}
                    value={price?.sellingPrice ?? ""}
                    onChange={(event) =>
                      setPrice((current) =>
                        current
                          ? { ...current, sellingPrice: Number(event.target.value) }
                          : current,
                      )
                    }
                    className="rounded-xl border bg-background px-3 py-2 font-normal"
                  />
                </label>
              </div>
              <button className="mt-4 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground">
                Save prices
              </button>
            </form>

            <form
              onSubmit={(event) => void saveDelivery(event)}
              className="rounded-3xl border bg-card p-5 sm:p-7"
            >
              <h2 className="text-2xl font-bold">Standard delivery</h2>
              <label className="mt-4 grid gap-1 text-sm font-semibold">
                Delivery charge (PKR)
                <input
                  required
                  type="number"
                  min={0}
                  value={deliveryCharge}
                  onChange={(event) => setDeliveryCharge(Number(event.target.value))}
                  className="rounded-xl border bg-background px-3 py-2 font-normal"
                />
              </label>
              <button className="mt-4 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground">
                Save delivery charge
              </button>
            </form>

            <section className="rounded-3xl border bg-card p-5 sm:p-7">
              <h2 className="text-2xl font-bold">Payment options</h2>
              <div className="mt-4 grid gap-3">
                {paymentOptions?.methods.map((method) => (
                  <label
                    key={method.id}
                    className="flex items-center gap-3 rounded-xl border p-3 font-semibold"
                  >
                    <input
                      type="checkbox"
                      checked={method.enabled}
                      onChange={(event) =>
                        setPaymentOptions((current) =>
                          current
                            ? {
                                methods: current.methods.map((item) =>
                                  item.id === method.id
                                    ? { ...item, enabled: event.target.checked }
                                    : item,
                                ),
                              }
                            : current,
                        )
                      }
                    />
                    {method.id === "cod" ? "Cash on delivery" : "Pay Online"}
                  </label>
                ))}
              </div>
              <button
                onClick={() => void savePaymentOptions()}
                className="mt-4 rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground"
              >
                Save payment options
              </button>
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}
