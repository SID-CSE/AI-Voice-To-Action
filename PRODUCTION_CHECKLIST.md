# Production Checklist

Complete the provider/account steps in `DEPLOYMENT_GUIDE.md`. Never place secrets in this checklist or in Git commit messages.

## Source and local validation

- [ ] Existing Git changes reviewed and preserved
- [ ] No `.env`, credentials, private production data, or local runtime files staged
- [ ] `npm ci` passes from the lockfile
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `npm run build:client` passes
- [ ] `npm run build` passes
- [ ] `npm audit --omit=dev` passes
- [ ] No hardcoded production API host or unintended `localhost` URL in application source
- [ ] `.env.example` contains names and safe blank values only

## Services and environment configuration

- [ ] GitHub repository and intended deployment branch reviewed
- [ ] Neon project created in an appropriate region
- [ ] `DATABASE_URL` configured in Vercel Preview and Production
- [ ] Neon schema initialization verified through `/api/health` and a real write/read
- [ ] Preview and Production data are separated, or shared-data impact is understood
- [ ] Clerk development and production instances chosen deliberately
- [ ] Matching `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `VITE_CLERK_PUBLISHABLE_KEY` configured for Preview/Production
- [ ] Production domain authorized in the matching Clerk production instance
- [ ] `GEMINI_API_KEY` configured if Gemini-backed analysis is required
- [ ] `BLOB_READ_WRITE_TOKEN` configured if public guest original-file uploads are required
- [ ] Vercel project root, `npm run build:client`, `dist`, API entry, and SPA rewrites verified
- [ ] Vercel security headers and HTTPS domain verified

## Product behavior and security

- [ ] Guest demo tested without signing in; guest data is visibly labelled public/shared
- [ ] Guest create/update/delete and refresh behavior tested
- [ ] User A sign-up/sign-in, persistence, and sign-out tested
- [ ] User B tested in a separate browser profile
- [ ] User A and User B cannot see one another's tasks or knowledge documents
- [ ] Guest cannot see signed-in data; signed-in users cannot see guest data
- [ ] Account-switch sequence Guest → User A → User B → Guest → User A tested
- [ ] Client-supplied IDs/fields cannot change task ownership or server-managed task IDs
- [ ] Duplicate/invalid action confirmations are rejected
- [ ] Rate limits and per-workspace task/document caps return safe 429/409 responses
- [ ] API errors do not reveal stack traces, provider responses, request content, or secrets
- [ ] Guest TXT/MD/CSV upload tested with non-confidential content under 512 KB
- [ ] Unsupported file type and over-limit upload rejected
- [ ] Authenticated file upload indexes text privately and does not publish/store the original
- [ ] Data remains after refresh and a later function instance/deployment
- [ ] Gemini success and missing/failed-key fallback tested
- [ ] `/api/health` reports database readiness and safe integration booleans
- [ ] No secrets committed; leaked credentials rotated

## Operations

- [ ] Vercel Preview deployment tested before Production promotion
- [ ] Production homepage, direct route refresh, and `/api/health` tested over HTTPS
- [ ] Vercel runtime/build logs reviewed without copying secrets into public messages
- [ ] Provider quotas/spending alerts or usage controls reviewed for Gemini and Blob
- [ ] Current known-good Vercel deployment identified for rollback
- [ ] No private file originals are publicly stored; authenticated uploads retain indexed text only
- [ ] Rollback action and data-preservation considerations understood
- [ ] Production URL and environment owner recorded in a private team location
