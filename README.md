# My Online Store

A Next.js 14 + Supabase store with public product browsing/search, product pages, cart, WhatsApp checkout, and an admin dashboard.

## You do not need to run npm on your own device
1. Create a GitHub repository.
2. Upload the contents of this folder (not the ZIP file itself) to the repository.
3. Create a Supabase project and run `supabase/schema.sql` in Supabase SQL Editor.
4. In Supabase Storage, create a **public** bucket named `product-images`.
5. In Supabase Authentication, create a user for the store owner. The email must be included in `ADMIN_EMAILS`.
6. In Vercel, import the GitHub repository and add all variables listed in `.env.example`.
7. Deploy. Vercel installs dependencies from `package.json` and builds the site automatically.

## Important setup notes
- `ADMIN_EMAILS` is a comma-separated allowlist, for example `owner@example.com,manager@example.com`.
- `NEXT_PUBLIC_STORE_NAME` is the name shown to shoppers.
- Never put `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_` variable or share it publicly.
- `NEXT_PUBLIC_STORE_WHATSAPP_NUMBER` must use international digits only, e.g. `2348012345678`, without `+`, spaces or brackets. This number is public in the website bundle, as expected for a store contact number.
- The public bucket makes product images publicly viewable. Do not upload private documents.
- Orders are saved server-side after the server reloads current product prices from Supabase. WhatsApp opens with the order message; the customer still has to press Send.
- For live use, set up Supabase email/password authentication and use a strong password. Add only trusted admin email addresses to `ADMIN_EMAILS`.

## Pages
- `/` public store
- `/products/[id]` product details
- `/cart` cart
- `/checkout` checkout
- `/admin/login` admin login
- `/admin/dashboard` admin product/category/order management

## Database
Run the SQL in `supabase/schema.sql` in Supabase SQL Editor. The app uses server-side service-role access only after admin verification for management actions and uses server-side checkout for order creation.
