This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

## Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Production checklist (orders & email)

- Create a `.env.local` from `.env.example` with these variables set:
  - `MONGODB_URI`, `JWT_SECRET` (required) and `ADMIN_EMAIL` (recommended)
  - For real emails set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (optional, if not set emails will be logged to the server console)
  - Optional production storage: `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- Install dependencies: `npm ci`
- Local dev: `npm run dev`
- Build and start: `npm run build && npm run start`
- Run checks and tests: `npm run lint`, `npm run check`, `npm run test`

- Verify the following flows before public release:
  - Place an order: confirm order appears in DB and product stock adjusts.
  - Register / Log in: use the Register form to create an account, or use Login to sign in. The current app uses session-scoped tokens stored in `sessionStorage` but a cookie-based auth is recommended for production (see Roadmap below).
  - Admin: create an admin user (role: 'admin' in the DB) and log in to access the Admin panel and manage orders.
  - Emails: verify confirmation emails are sent (or logged) for both user and admin.

Roadmap / Recommended next steps before production:
- Switch auth tokens to HttpOnly SameSite cookies (more secure than `sessionStorage`).
- Enable MongoDB replica set and use transactions for order placement to make stock updates atomic.
- Configure Sentry or another error monitoring tool for server-side error aggregation.
- Add a CDN or object storage for product images (S3 + Cloudflare / Vercel platform).
- Configure environment & secrets in Vercel and set the `NODE_ENV=production` environment variables via the dashboard.

---

## Production: Emails, S3, and Vercel deployment 🔧

### Sending real emails
- The app uses `nodemailer` and reads SMTP configuration from these env vars:
  - `SMTP_HOST` — e.g., `smtp.sendgrid.net` or your SMTP provider host
  - `SMTP_PORT` — e.g., `587` (TLS) or `465` (SSL)
  - `SMTP_USER` — your SMTP username
  - `SMTP_PASS` — your SMTP password or API key
  - `SMTP_FROM` — sender address, e.g., `no-reply@yourdomain.com`
- If these values are not set, the app will **simulate** sends by logging the email (safe for development).
- Test sending a real email with the test endpoint: POST `/api/mail/test` with JSON `{ "to": "you@example.com" }`. This endpoint will call `sendMail` and report success or failure.

Recommended providers:
- SendGrid, Mailgun, Amazon SES (SMTP or API), or Mailtrap for staging.
- For SendGrid using SMTP set `SMTP_HOST=smtp.sendgrid.net`, `SMTP_PORT=587`, `SMTP_USER=apikey`, `SMTP_PASS=<SENDGRID_API_KEY>`.

### S3 / Image storage
- The code supports S3 via these env vars (optional — if unset, images are saved to `public/images`):
  - `S3_BUCKET`
  - `S3_REGION`
  - `S3_ACCESS_KEY_ID`
  - `S3_SECRET_ACCESS_KEY`
  - `S3_ENDPOINT` (optional, for non-AWS S3-compatible providers)
- When S3 is configured, uploaded base64 images are stored in S3 and public URLs are returned. When not configured, files are saved to `public/images`.
- Make sure your S3 bucket is public or configure a CDN (CloudFront/Cloudflare) to serve images over HTTPS for production.

### Deploying to Vercel
1. Push your branch to GitHub.
2. Import the repo into Vercel and set the build command to `npm run build` (default for Next.js).
3. Add environment variables in the Vercel project settings (Preview/Production):
   - `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (for real email)
   - `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (if using S3)
   - `SENTRY_DSN` (optional)
   - `NEXT_PUBLIC_LOG_LEVEL` (optional; e.g., `info` or `error` in production)
4. Deploy and run smoke tests on the preview deployment:
   - Register/login
   - Place an order (observe stock decrement)
   - Check `/api/mail/test` to confirm email delivery
   - Validate image uploads or that product images load from S3 / CDN

If you'd like, I can add a small verification script or GitHub Action step to validate SMTP and S3 credentials during CI.
