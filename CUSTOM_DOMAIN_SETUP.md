# Custom Domain Configuration Guide
## Domain: your-domain.com

This guide will help you configure custom domains for all services in Cloudflare Multi-Agent.

## Prerequisites

1. Domain `your-domain.com` must be added to your Cloudflare account
2. Nameservers must be pointed to Cloudflare
3. SSL/TLS mode should be set to "Full (strict)" in Cloudflare dashboard

## Domain Structure

### Pages Projects (Frontend Interfaces)
- `monitoring.your-domain.com` - Monitoring Dashboard
- `admin.your-domain.com` - Admin Panel
- `testing.your-domain.com` - Testing GUI

### Workers (Backend APIs)
- `api.your-domain.com` - Config Service (Main API)
- `images.your-domain.com` - Image Generation Worker
- `ratelimit.your-domain.com` - Rate Limiter (if exposed)

---

## Step 1: DNS Configuration

### Add DNS Records in Cloudflare Dashboard

Go to your Cloudflare dashboard → DNS → Records and add the following CNAME records:

#### For Pages Projects:
```
Type: CNAME
Name: monitoring
Target: monitoring-dashboard.pages.dev
Proxy status: Proxied (orange cloud)

Type: CNAME
Name: admin
Target: admin-panel.pages.dev (or your current admin panel deployment)
Proxy status: Proxied (orange cloud)

Type: CNAME
Name: testing
Target: testing-gui.pages.dev (or your current testing GUI deployment)
Proxy status: Proxied (orange cloud)
```

#### For Workers:
```
Type: CNAME
Name: api
Target: @
Proxy status: Proxied (orange cloud)

Type: CNAME
Name: images
Target: @
Proxy status: Proxied (orange cloud)
```

**Note**: Workers use routes, so the CNAME points to the root (@) and traffic is routed by the Worker.

---

## Step 2: Configure Pages Projects Custom Domains

### Monitoring Dashboard

```bash
# Navigate to monitoring dashboard
cd interfaces/monitoring

# Add custom domain
npx wrangler pages project list
npx wrangler pages deployment list --project-name=monitoring-dashboard

# Add custom domain via Cloudflare dashboard or CLI
# Dashboard: Pages → monitoring-dashboard → Custom domains → Set up a domain
# Add: monitoring.your-domain.com
```

### Admin Panel

```bash
# Navigate to admin panel
cd interfaces/admin-panel

# Deploy first if not already deployed
npm run build
npx wrangler pages deploy dist --project-name=admin-panel --branch=master

# Add custom domain via Cloudflare dashboard
# Dashboard: Pages → admin-panel → Custom domains → Set up a domain
# Add: admin.your-domain.com
```

### Testing GUI

```bash
# Navigate to testing GUI
cd interfaces/testing-gui

# Deploy if needed
npx wrangler pages deploy public --project-name=testing-gui --branch=master

# Add custom domain via Cloudflare dashboard
# Dashboard: Pages → testing-gui → Custom domains → Set up a domain
# Add: testing.your-domain.com
```

---

## Step 3: Deploy Workers with Custom Routes

The wrangler.toml files have been updated with custom routes. Now deploy the workers:

### Config Service

```bash
cd infrastructure/config-service
npx wrangler deploy
```

This will deploy to `api.your-domain.com`

### Image Generation Worker

```bash
cd workers/image-gen
npx wrangler deploy
```

This will deploy to `images.your-domain.com`

### Rate Limiter

```bash
cd workers/shared/rate-limiter
npx wrangler deploy
```

(This is typically called internally by other workers, not exposed externally)

---

## Step 4: Update Application Configuration

Update API endpoints in your frontend applications to use the new custom domains:

### Monitoring Dashboard
File: `interfaces/monitoring/src/services/api.js`

```javascript
constructor() {
  this.baseUrl = 'https://api.your-domain.com'
}
```

### Admin Panel
File: `interfaces/admin-panel/src/services/api.js`

```javascript
constructor() {
  this.baseUrl = 'https://api.your-domain.com'
}
```

### Testing GUI
File: `interfaces/testing-gui/public/app.js`

Update the API endpoint to:
```javascript
const API_URL = 'https://images.your-domain.com'
```

---

## Step 5: Verify SSL Certificates

After adding custom domains, Cloudflare automatically provisions SSL certificates. This usually takes 1-5 minutes.

Check certificate status:
- Go to Cloudflare Dashboard → SSL/TLS → Edge Certificates
- Verify all custom domains show "Active Certificate"

---

## Step 6: Test All Endpoints

### Test Pages Projects:
```bash
curl -I https://monitoring.your-domain.com
curl -I https://admin.your-domain.com
curl -I https://testing.your-domain.com
```

### Test Workers:
```bash
# Config Service
curl https://api.your-domain.com/health

# Image Generation
curl https://images.your-domain.com/health
```

---

## Automated Setup Script

For convenience, here's a script to add custom domains to Pages projects:

```bash
#!/bin/bash

# Add custom domains to Pages projects
echo "Adding custom domains..."

# You'll need to do this via Cloudflare dashboard or API
# The wrangler CLI doesn't directly support adding custom domains yet

echo "Please add the following custom domains via Cloudflare Dashboard:"
echo "1. monitoring.your-domain.com → monitoring-dashboard project"
echo "2. admin.your-domain.com → admin-panel project"
echo "3. testing.your-domain.com → testing-gui project"
```

---

## Troubleshooting

### DNS Not Resolving
- Verify DNS records are set to "Proxied" (orange cloud)
- Wait 1-5 minutes for DNS propagation
- Check: `dig monitoring.your-domain.com`

### SSL Certificate Issues
- Ensure SSL/TLS mode is "Full (strict)"
- Wait for certificate provisioning (1-5 minutes)
- Check Cloudflare dashboard → SSL/TLS → Edge Certificates

### Worker Routes Not Working
- Verify the zone (domain) is added to your Cloudflare account
- Check wrangler.toml routes configuration
- Redeploy the worker: `npx wrangler deploy`

### 522 or 524 Errors
- Check worker is deployed and running
- Verify route patterns match exactly
- Check worker logs: `npx wrangler tail`

---

## Quick Reference

| Service | Custom Domain | Type | Configuration |
|---------|--------------|------|---------------|
| Monitoring Dashboard | monitoring.your-domain.com | Pages | Cloudflare Dashboard |
| Admin Panel | admin.your-domain.com | Pages | Cloudflare Dashboard |
| Testing GUI | testing.your-domain.com | Pages | Cloudflare Dashboard |
| Config Service | api.your-domain.com | Worker | wrangler.toml routes |
| Image Gen Worker | images.your-domain.com | Worker | wrangler.toml routes |

---

## Next Steps

1. ✅ DNS records configured
2. ✅ Worker routes updated in wrangler.toml
3. ⬜ Add custom domains to Pages projects via Cloudflare dashboard
4. ⬜ Deploy workers with new routes
5. ⬜ Update frontend API endpoints
6. ⬜ Test all endpoints
7. ⬜ Update documentation with new URLs

---

## Support

If you encounter issues:
- Check Cloudflare dashboard for DNS and SSL status
- View worker logs: `npx wrangler tail <worker-name>`
- Cloudflare Docs: https://developers.cloudflare.com/pages/platform/custom-domains/
