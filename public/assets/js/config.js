// Central configuration. When the backend is ready, point the endpoints at the
// real API and switch the feature flags on — no component code needs to change.
export const CONFIG = {
  siteUrl: "https://shaznest.com",
  brand: "ShaZ Nest",
  tagline: "From Our Nest To Yours",
  instagram: { handle: "@shaz.nest", url: "https://www.instagram.com/shaz.nest/" },

  api: {
    // Temporary static catalogue. Later: "/api/v1/products"
    products: "/data/products.json",
    createOrder: "/api/v1/orders",
    orderTracking: (orderNumber) => `/api/v1/orders/${encodeURIComponent(orderNumber)}/tracking`,
  },

  features: {
    // Keep false until Razorpay is integrated and verified end to end.
    onlinePayment: false,
    // Keep false until GET /api/v1/orders/{orderNumber}/tracking exists.
    orderTracking: false,
  },
};

export const CATEGORIES = [
  { slug: "hijabs", name: "Hijabs" },
  { slug: "accessories", name: "Accessories" },
];

export const categoryName = (slug) => CATEGORIES.find((c) => c.slug === slug)?.name || "";
