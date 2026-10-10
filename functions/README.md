# Cloudflare Pages Functions

This project uses native Pages Functions and D1; no server framework or runtime package is required.

## Configure Cloudflare Pages

1. Connect the repository to Cloudflare Pages and set the build output directory to `public`. Leave the build command empty for the current static site.
2. Create a D1 database, then add it to the Pages project as a binding named `DB` in both Production and Preview environments.
3. Apply `functions/schema.sql` to the database. With Wrangler installed and authenticated, run:

   ```sh
   npx wrangler d1 execute <database-name> --remote --file=functions/schema.sql
   ```

   For a database created from the earlier schema (before the variants column existed), apply `functions/migrations/0002_product_variants.sql` once instead of re-running the full schema. This adds the persisted product variant field without recreating existing tables.

4. Set `ADMIN_SECRET` as a Pages secret in both environments. Use a random secret of at least 16 characters; never commit it or expose it to browser code.
5. For product and proof uploads, create an R2 bucket and bind it as `ASSETS`. Set `PUBLIC_ASSET_BASE_URL` to the HTTPS public/custom-domain base URL for that bucket. Uploads return a configuration error until both are set.
6. If a separate frontend origin is required, set `CORS_ORIGINS` to a comma-separated allowlist of exact HTTPS origins. Same-origin Pages deployments need no CORS setting.

The D1 schema is designed to work within the Cloudflare free-tier model, subject to Cloudflare's current account quotas and retention limits. Heartbeat rows expire after 45 seconds even if a tab crashes or loses network access. Do not collect precise location or identifying visitor details in this anonymous analytics path.

## Routes

- `POST /api/v1/admin/session`: compare `{ "passcode": "..." }` with `ADMIN_SECRET` and issue an expiring HttpOnly, Secure-on-HTTPS, SameSite=Strict admin cookie.
- `GET /api/v1/admin/session`: check the admin cookie; `DELETE` clears it.
- `/api/v1/admin/products`: authenticated product list/create/update/delete. Update/delete use the `id` query parameter.
- `/api/v1/admin/orders`: authenticated order list. `PUT ?id=<id>` updates a valid forward delivery status; `POST ?id=<id>&action=loyalty-stamp` issues one stamp only for a delivered order.
- `/api/v1/admin/customers`: authenticated CRM list with total order count and loyalty stamps.
- `/api/v1/admin/analytics/live`: also reports paid sales, average paid-order value, active orders, and order pipeline inputs.
- `POST /api/v1/admin/review-proofs`: authenticated image upload; records remain unverified until approved by a trusted workflow.
- `/api/v1/admin/review-proofs`: authenticated review queue; `PUT ?id=<id>` approves/unpublishes a proof and `DELETE ?id=<id>` rejects it.
- `GET /api/v1/review-proofs`: returns verified proofs only.
- `POST /api/v1/analytics/ping`: anonymous active/inactive heartbeat.
- `GET /api/v1/admin/analytics/live`: authenticated, expiring active counts and recent actions.

Missing D1, admin secret, or R2 bindings return explicit `503` JSON responses. The frontend does not treat unavailable services as successful changes.

## Payments (Razorpay) and orders

Set these as Pages secrets/variables in both Production and Preview:

- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (use the `rzp_test_...` pair until you go live). The secret must never appear in browser code.
- `SHIPPING_FLAT_RUPEES` (optional): a flat delivery charge added to every order. Leave unset for free delivery.

Seed the sample catalogue once (optional): `npx wrangler d1 execute <database-name> --remote --file=functions/seed.sql`.
If the database was created before this change, also apply `functions/migrations/0004_drop_payment_stamp_trigger.sql`.

Order flow:

- `POST /api/v1/orders`: validates the cart, prices it from the `products` table (browser prices are ignored), creates the Razorpay order and saves a `pending` order. Returns `{ keyId, id, amount, currency, orderNumber }`.
- `POST /api/v1/payments/verify`: checks Razorpay's HMAC-SHA256 signature of `orderId|paymentId`, marks the order `paid` and reduces stock. Repeating the same verification is safe.
- `GET /api/v1/orders/{orderNumber}/tracking`: public status of a paid order (no personal details).
- `GET /api/v1/products`: public active catalogue used by the storefront.

Loyalty rewards are not applied at checkout yet; they need verified customer accounts (`/api/v1/auth/google` and `/api/v1/customer/*` are not implemented).
