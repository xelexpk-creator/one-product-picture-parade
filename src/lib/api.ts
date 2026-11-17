const API_BASE_URL = (import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost:4000/api").replace(
  /\/$/,
  "",
);
function getCandidateUrls(path: string, baseUrl = API_BASE_URL, includeLegacyUrl = true): string[] {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const candidates = [baseUrl + normalizedPath];

  if (!includeLegacyUrl) return candidates;

  const legacyBaseUrl = baseUrl.endsWith("/api/v1")
    ? baseUrl
    : baseUrl.replace(/\/api$/, "/api/v1");
  if (baseUrl !== legacyBaseUrl) {
    candidates.push(legacyBaseUrl + normalizedPath);
  }

  return candidates;
}

export interface PriceDetails {
  originalPrice: number;
  sellingPrice: number;
  currency: "PKR";
}

export interface StoreSettings {
  actualPrice: number;
  sellingPrice: number;
  shippingCharges: number;
  freeShippingAbove: number;
  codEnabled: boolean;
  onlinePaymentEnabled: boolean;
  isAvailable: boolean;
}

export interface PriceQuote {
  unitPrice: number;
  quantity: number;
  subtotal: number;
  voucherDiscount: number;
  deliveryCharge: number;
  total: number;
  voucherCode?: string;
  remainingUses?: number;
}

export interface CouponValidation {
  valid: boolean;
  code?: string;
  discountAmount?: number;
  finalAmount?: number;
  message?: string;
}

export interface PaymentOptions {
  methods: { id: "cod" | "online"; enabled: boolean }[];
}

export interface OrderSummary {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export interface AdminOrder extends OrderSummary {
  _id: string;
  customer: {
    fullName: string;
    address: string;
    phone: string;
    alternatePhone: string;
  };
  quantity: number;
  subtotal: number;
  voucherCode: string;
  voucherDiscount: number;
  deliveryCharge: number;
  total: number;
  paymentMethod: "COD" | "ONLINE" | "CARD" | "cod" | "online" | "stripe";
  paymentScreenshot?: string;
}

export interface VoucherInfo {
  _id: string;
  code: string;
  type: "fixed" | "percentage";
  amount: number;
  maxUses: number;
  usedCount: number;
  minimumOrderAmount: number;
  active: boolean;
  expiresAt: string | null;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
  baseUrl = API_BASE_URL,
  includeLegacyUrl = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const urls = getCandidateUrls(path, baseUrl, includeLegacyUrl);

  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index]!;
    const response = await fetch(url, { ...options, headers: new Headers(headers) });

    if (response.ok) {
      const body = await response.json().catch(() => undefined);
      return body as T;
    }

    const isLastAttempt = index === urls.length - 1;
    if (!isLastAttempt && response.status === 404) {
      continue;
    }

    const body: unknown = await response.json().catch(() => undefined);
    const message =
      typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
        ? body.error
        : typeof body === "object" &&
            body !== null &&
            "message" in body &&
            typeof body.message === "string"
          ? body.message
          : `Request failed (${response.status}).`;
    throw new Error(message);
  }

  throw new Error("Request failed.");
}

export const storeApi = {
  getSettings: () => request<StoreSettings>("/store/settings"),
  getPrice: async () => {
    const settings = await storeApi.getSettings();
    return {
      originalPrice: settings.actualPrice,
      sellingPrice: settings.sellingPrice,
      currency: "PKR" as const,
    };
  },
  getDelivery: async () => {
    const settings = await storeApi.getSettings();
    return { deliveryCharge: settings.shippingCharges, currency: "PKR" as const };
  },
  getPaymentOptions: async () => {
    const settings = await storeApi.getSettings();
    return {
      methods: [
        { id: "cod" as const, enabled: settings.codEnabled },
        { id: "online" as const, enabled: settings.onlinePaymentEnabled },
      ],
    };
  },
  validateCoupon: async (code: string, orderAmount: number) => {
    const response = await request<CouponValidation>(
      "/coupons/validate",
      {
        method: "POST",
        body: JSON.stringify({ code, orderAmount }),
      },
      undefined,
      API_BASE_URL.replace(/\/v1$/, ""),
      false,
    );

    if (!response.valid) {
      throw new Error(response.message ?? "Coupon code is invalid.");
    }

    if (
      typeof response.code !== "string" ||
      typeof response.discountAmount !== "number" ||
      !Number.isFinite(response.discountAmount) ||
      typeof response.finalAmount !== "number" ||
      !Number.isFinite(response.finalAmount)
    ) {
      throw new Error("Coupon validation returned an invalid response.");
    }

    return {
      code: response.code,
      discountAmount: response.discountAmount,
      finalAmount: response.finalAmount,
    };
  },
  createOrder: async (body: {
    fullName: string;
    address: string;
    phone: string;
    alternatePhone?: string;
    quantity: number;
    voucherCode?: string;
    paymentMethod: "cod" | "online";
    paymentScreenshot?: string;
  }) => {
    const { voucherCode, paymentScreenshot, ...orderBody } = body;
    const response = await request<{
      success?: boolean;
      data?: {
        orderNumber?: string;
        orderStatus?: string;
        status?: string;
        totalAmount?: number;
        total?: number;
      };
      message?: string;
    }>("/orders", {
      method: "POST",
      body: JSON.stringify({
        ...orderBody,
        customer: {
          fullName: body.fullName,
          phone: body.phone,
          ...(body.alternatePhone ? { alternatePhone: body.alternatePhone } : {}),
        },
        paymentMethod: body.paymentMethod === "online" ? "ONLINE" : "COD",
        paymentScreenshot,
        shippingAddress: {
          address: body.address,
          city: "Karachi",
          province: "Sindh",
          country: "Pakistan",
        },
        couponCode: voucherCode,
      }),
    });

    if (
      typeof response === "object" &&
      response !== null &&
      "success" in response &&
      response.success === false
    ) {
      throw new Error(response.message ?? "Could not place your order.");
    }

    const payload = (response?.data ?? response) as {
      orderNumber?: string;
      orderStatus?: string;
      status?: string;
      totalAmount?: number;
      total?: number;
    };
    return {
      orderNumber: payload.orderNumber ?? "",
      status: payload.orderStatus ?? payload.status ?? "placed",
      total: payload.totalAmount ?? payload.total ?? 0,
    };
  },
  trackOrder: async (orderNumber: string) => {
    try {
      const response = await request<{
        data?: OrderSummary;
        success?: boolean;
        message?: string;
      }>("/orders/track", {
        method: "POST",
        body: JSON.stringify({ orderNumber }),
      });

      if (
        typeof response === "object" &&
        response !== null &&
        "success" in response &&
        response.success === false
      ) {
        throw new Error(response.message ?? "Could not find that order.");
      }

      return (response.data ?? response) as OrderSummary;
    } catch {
      return request<OrderSummary>(`/orders/track/${encodeURIComponent(orderNumber)}`);
    }
  },
};

export const adminApi = {
  login: (email: string, password: string) =>
    request<{ token: string; email: string }>("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  getOrders: (token: string, page: number) =>
    request<{ items: AdminOrder[]; total: number }>(
      `/admin/orders?page=${page}&limit=25`,
      {},
      token,
    ),
  updateOrderStatus: (token: string, id: string, status: string) =>
    request<{ orderNumber: string; status: string }>(
      `/admin/orders/${encodeURIComponent(id)}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) },
      token,
    ),
  getVouchers: (token: string) => request<{ items: VoucherInfo[] }>("/admin/vouchers", {}, token),
  createVoucher: (
    token: string,
    body: {
      code: string;
      type: "fixed" | "percentage";
      amount: number;
      maxUses: number;
      minimumOrderAmount: number;
    },
  ) =>
    request<VoucherInfo>("/admin/vouchers", { method: "POST", body: JSON.stringify(body) }, token),
  updateVoucher: (token: string, id: string, body: { active: boolean }) =>
    request<VoucherInfo>(
      `/admin/vouchers/${encodeURIComponent(id)}`,
      { method: "PATCH", body: JSON.stringify(body) },
      token,
    ),
  updatePrice: (token: string, body: { originalPrice: number; sellingPrice: number }) =>
    request<PriceDetails>(
      "/admin/product/price",
      { method: "PUT", body: JSON.stringify(body) },
      token,
    ),
  updateDelivery: (token: string, deliveryCharge: number) =>
    request<{ deliveryCharge: number }>(
      "/admin/delivery/charges",
      { method: "PUT", body: JSON.stringify({ deliveryCharge }) },
      token,
    ),
  updatePaymentOptions: (token: string, body: { codEnabled: boolean; onlineEnabled: boolean }) =>
    request<PaymentOptions>(
      "/admin/payment-options",
      { method: "PUT", body: JSON.stringify(body) },
      token,
    ),
};

export function formatPKR(amount: number): string {
  return `Rs ${amount.toLocaleString("en-PK")}`;
}
