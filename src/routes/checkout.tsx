import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  formatPKR,
  storeApi,
  type PaymentOptions,
  type PriceQuote,
  type StoreSettings,
} from "../lib/api";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const [settings, setSettings] = useState<StoreSettings>();
  const [paymentOptions, setPaymentOptions] = useState<PaymentOptions>();
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [voucherCode, setVoucherCode] = useState("");
  const [quote, setQuote] = useState<PriceQuote>();
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>();
  const [screenshotName, setScreenshotName] = useState("");
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    storeApi
      .getSettings()
      .then((storeSettings) => {
        setSettings(storeSettings);
        const methods = {
          methods: [
            { id: "cod" as const, enabled: storeSettings.codEnabled },
            { id: "online" as const, enabled: storeSettings.onlinePaymentEnabled },
          ],
        };
        setPaymentOptions(methods);
        if (!storeSettings.codEnabled && storeSettings.onlinePaymentEnabled) {
          setPaymentMethod("online");
        }
      })
      .catch((loadError: unknown) => {
        setError(
          loadError instanceof Error ? loadError.message : "Could not load checkout settings.",
        );
      });
  }, []);

  const currentPrice = useMemo(() => {
    if (quote && quote.quantity === quantity) return quote;
    if (!settings) return undefined;
    const subtotal = settings.sellingPrice * quantity;
    const deliveryCharge = subtotal >= settings.freeShippingAbove ? 0 : settings.shippingCharges;
    return {
      unitPrice: settings.sellingPrice,
      quantity,
      subtotal,
      voucherDiscount: 0,
      deliveryCharge,
      total: subtotal + deliveryCharge,
    };
  }, [quantity, quote, settings]);

  async function applyVoucher() {
    setError("");
    setQuote(undefined);
    if (!voucherCode.trim()) return;
    if (!settings) {
      setError("Store settings are still loading. Please try again.");
      return;
    }

    setApplyingCoupon(true);
    try {
      const subtotal = settings.sellingPrice * quantity;
      const result = await storeApi.validateCoupon(voucherCode.trim(), subtotal);
      const deliveryCharge = subtotal >= settings.freeShippingAbove ? 0 : settings.shippingCharges;
      setQuote({
        unitPrice: settings.sellingPrice,
        quantity,
        subtotal,
        voucherDiscount: result.discountAmount,
        deliveryCharge,
        total: result.finalAmount + deliveryCharge,
        voucherCode: result.code,
      });
    } catch (quoteError) {
      setError(quoteError instanceof Error ? quoteError.message : "Could not apply voucher.");
    } finally {
      setApplyingCoupon(false);
    }
  }

  function handleScreenshotChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPaymentScreenshot(undefined);
    setScreenshotName("");
    setScreenshotLoading(false);
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError("Payment screenshot must be 8 MB or smaller.");
      event.target.value = "";
      return;
    }
    setError("");
    setScreenshotName(file.name);
    setScreenshotLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setPaymentScreenshot(reader.result);
      else setError("Could not read the payment screenshot. Please select it again.");
      setScreenshotLoading(false);
    };
    reader.onerror = () => {
      setError("Could not read the payment screenshot. Please select it again.");
      setScreenshotLoading(false);
    };
    reader.readAsDataURL(file);
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (paymentMethod === "online" && !paymentScreenshot) {
      setError("Please attach your payment screenshot to place this order.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const order = await storeApi.createOrder({
        fullName,
        address,
        phone,
        ...(alternatePhone.trim() ? { alternatePhone } : {}),
        quantity,
        ...(quote?.voucherCode ? { voucherCode: quote.voucherCode } : {}),
        paymentMethod,
        ...(paymentScreenshot ? { paymentScreenshot } : {}),
      });
      window.location.assign(`/track?orderNumber=${encodeURIComponent(order.orderNumber)}`);
    } catch (orderError) {
      setError(orderError instanceof Error ? orderError.message : "Could not place your order.");
      setSubmitting(false);
    }
  }

  const enabledMethods = paymentOptions?.methods.filter((method) => method.enabled) ?? [];

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="text-sm font-bold text-primary hover:underline">
          ← Back to XeleX
        </Link>
        <h1 className="mt-5 text-4xl font-extrabold">Complete your order</h1>
        <p className="mt-2 text-muted-foreground">5-in-1 Hair Dryer &amp; Multi-Styler</p>

        <form
          onSubmit={submitOrder}
          className="mt-8 grid gap-8 rounded-3xl border bg-card p-6 shadow-sm sm:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
              Full name
              <input
                required
                minLength={2}
                maxLength={100}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="rounded-xl border bg-background px-4 py-3 font-normal"
                autoComplete="name"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold sm:col-span-2">
              Address
              <textarea
                required
                minLength={8}
                maxLength={500}
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className="min-h-24 rounded-xl border bg-background px-4 py-3 font-normal"
                autoComplete="street-address"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Phone number
              <input
                required
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="rounded-xl border bg-background px-4 py-3 font-normal"
                autoComplete="tel"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Alternate phone <span className="font-normal text-muted-foreground">(optional)</span>
              <input
                type="tel"
                value={alternatePhone}
                onChange={(event) => setAlternatePhone(event.target.value)}
                className="rounded-xl border bg-background px-4 py-3 font-normal"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Quantity
              <input
                required
                type="number"
                min={1}
                max={20}
                value={quantity}
                disabled={applyingCoupon}
                onChange={(event) => {
                  setQuantity(Number(event.target.value));
                  setQuote(undefined);
                }}
                className="rounded-xl border bg-background px-4 py-3 font-normal"
              />
            </label>
            <div className="grid content-end gap-2">
              <label htmlFor="voucher" className="text-sm font-semibold">
                Discount code
              </label>
              <div className="flex gap-2">
                <input
                  id="voucher"
                  value={voucherCode}
                  disabled={applyingCoupon}
                  onChange={(event) => {
                    setVoucherCode(event.target.value);
                    setQuote(undefined);
                    setError("");
                  }}
                  className="min-w-0 flex-1 rounded-xl border bg-background px-4 py-3 font-normal"
                />
                <button
                  type="button"
                  onClick={applyVoucher}
                  disabled={applyingCoupon || !settings}
                  className="rounded-xl border px-4 py-3 text-sm font-bold hover:bg-secondary"
                >
                  {applyingCoupon ? "Checking…" : "Apply"}
                </button>
              </div>
            </div>
          </div>

          <section aria-label="Order total" className="grid gap-2 border-t pt-5 text-sm">
            <div className="flex justify-between">
              <span>Price × {quantity}</span>
              <span>{currentPrice ? formatPKR(currentPrice.subtotal) : "Loading…"}</span>
            </div>
            {currentPrice && currentPrice.voucherDiscount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Voucher {quote?.voucherCode}</span>
                <span>−{formatPKR(currentPrice.voucherDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>
                {!currentPrice || currentPrice.deliveryCharge === 0
                  ? currentPrice
                    ? "Free"
                    : "Loading…"
                  : formatPKR(currentPrice.deliveryCharge)}
              </span>
            </div>
            <div className="mt-2 flex justify-between border-t pt-3 text-lg font-extrabold">
              <span>Total</span>
              <span>{currentPrice ? formatPKR(currentPrice.total) : "Loading…"}</span>
            </div>
          </section>

          <fieldset className="grid gap-3">
            <legend className="mb-1 text-sm font-bold">Payment method</legend>
            {enabledMethods.length === 0 && (
              <p className="text-sm text-destructive">
                No payment methods are currently available.
              </p>
            )}
            {enabledMethods.map((method) => (
              <label
                key={method.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border p-4"
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  checked={paymentMethod === method.id}
                  onChange={() => setPaymentMethod(method.id)}
                />
                <span className="font-semibold">
                  {method.id === "cod" ? "Cash on delivery" : "Pay Online"}
                </span>
              </label>
            ))}
          </fieldset>

          {paymentMethod === "online" && (
            <section className="rounded-2xl border-2 border-primary bg-primary/10 p-4 sm:p-5">
              <h2 className="text-lg font-extrabold">Pay Online — bank account details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Transfer your payment to the account below. Your order will be confirmed once we
                verify the payment.
              </p>
              <div className="mt-3 grid gap-1.5 rounded-xl bg-background p-4 text-sm font-semibold sm:text-base">
                <p>Account Name: Meezan Bank</p>
                <p>Account Title: Shaikh Abdul Rafay</p>
                <p>IBAN: PK02MEZN0000300112549949</p>
                <p>A/C Number: 00300112549949</p>
              </div>
              <label className="mt-4 grid gap-2 text-sm font-semibold">
                Payment screenshot <span className="text-destructive">*</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  required
                  onChange={handleScreenshotChange}
                  className="rounded-xl border bg-background px-4 py-3 font-normal file:mr-3 file:font-semibold"
                />
                <span className="text-xs font-normal text-muted-foreground">
                  {screenshotLoading
                    ? "Reading screenshot…"
                    : screenshotName
                      ? `Selected: ${screenshotName}`
                      : "Required for Pay Online. PNG, JPEG, WEBP, or GIF, up to 8 MB."}
                </span>
              </label>
            </section>
          )}

          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || screenshotLoading || enabledMethods.length === 0}
            className="rounded-full bg-primary px-6 py-4 font-bold text-primary-foreground shadow-pop disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Processing…"
              : !settings
                ? "Loading store settings…"
                : paymentMethod === "cod"
                  ? "Place cash-on-delivery order"
                  : "Place online payment order"}
          </button>
        </form>
      </div>
    </main>
  );
}
