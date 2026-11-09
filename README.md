# IBRO Fashion House — E-commerce + Admin Dashboard

This project contains a public clothing storefront (`/shop`), shopping cart, checkout, order database integration, an admin product dashboard (`/`), and order management (`/admin/orders`). It is a starter implementation: it is **not hosted or live until you configure Supabase, Meta WhatsApp credentials, and payment receiving details**.

## Included
- Responsive public storefront for desktop and mobile
- Product catalogue, category filter, search, product photos, stock and prices
- Shopping cart and customer checkout form
- Cash on Delivery, bKash and Nagad payment-method selection
- For bKash/Nagad: shows your merchant number and collects the transaction ID for manual verification
- Secure server-side order creation using the Supabase service-role key
- Orders and order items saved in Supabase
- WhatsApp Business Cloud API text notification to the store owner (when Meta credentials are configured)
- Admin order list and order status management
- Existing product inventory dashboard and image storage

## 1. Requirements
- Node.js 20.9 or later
- A Supabase project
- A Meta WhatsApp Business Platform / Cloud API setup for automated WhatsApp alerts

## 2. Install on Windows
1. Extract this ZIP.
2. Open the extracted folder in PowerShell.
3. Run `npm.cmd install`.
4. Copy `.env.example` to `.env.local`.
5. Fill in the environment variables described below.
6. Run `npm.cmd run dev` and open `http://localhost:3000`.

If PowerShell blocks `npm`, use `npm.cmd` as shown above.

## 3. Supabase setup
1. Create a Supabase project.
2. In Supabase → SQL Editor, run `supabase/schema.sql` first (for a brand-new database).
3. Then run `supabase/ecommerce.sql`.
4. In Supabase → Project Settings → API, copy the Project URL, anon/public key, and service_role key.
5. Add these to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only; never expose or share it)
6. In Supabase → Authentication → Users, create the admin login.
7. Restart the development server after editing `.env.local`.

The storefront shows products with stock greater than zero. The current inventory dashboard does not have a separate draft/publish toggle; therefore, in-stock products are visible publicly.

## 4. WhatsApp Business Cloud API setup
Configure a Meta WhatsApp Business Platform app and a WhatsApp sender phone number. Add these server-only values to `.env.local`:
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ADMIN_PHONE` (international format, e.g. `8801XXXXXXXXX`)
- `WHATSAPP_API_VERSION` (default in example: `v22.0`; use a version supported by your Meta app)

The server sends an order notification to the configured recipient after the order is saved. The access token must be valid and the recipient must be eligible to receive the message under Meta's messaging rules. For production, use a long-lived/system-user token, monitor token expiry, configure webhooks and follow Meta's current template/opt-in requirements. If credentials are missing or Meta rejects a message, the order is still saved; the admin order page shows whether the WhatsApp alert was sent.

## 5. bKash / Nagad setup in this version
Set:
- `NEXT_PUBLIC_BKASH_NUMBER`
- `NEXT_PUBLIC_NAGAD_NUMBER`

Customers choose bKash or Nagad, send money to the displayed number, and enter the Transaction ID. The order is saved as `verification_pending`; an admin must verify the payment manually. **This version does not yet call the official bKash/Nagad payment gateway APIs and does not automatically verify or capture payments.** To enable that, merchant accounts and gateway credentials/approval are required, followed by a provider-specific checkout/callback integration.

Cash on Delivery is saved as `unpaid` until staff update the order/payment process.

## 6. URLs
- `/shop` — customer storefront
- `/` — admin product dashboard
- `/admin/orders` — admin order management

## 7. Deploy
Deploy the Next.js project to a platform that supports server-side routes (for example, Vercel). Add all `.env.local` variables to the hosting platform's environment settings. Do not commit `.env.local` or expose `SUPABASE_SERVICE_ROLE_KEY` / `WHATSAPP_ACCESS_TOKEN` in browser code.

Before taking real orders, test a complete order with a low-value/test product, verify database records, WhatsApp notification delivery, payment reconciliation, stock handling, privacy notice, return/refund policy and delivery charges. This starter does not yet calculate courier charges or automatically decrement stock.
