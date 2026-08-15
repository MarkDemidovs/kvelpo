# Stripe Setup Guide for kvelpo

This guide will help you set up Stripe for the kvelpo subscription system.

## Prerequisites

- Stripe account (https://dashboard.stripe.com)
- Stripe CLI installed (optional but recommended for local testing)
- Node.js and npm installed

## Step 1: Create Stripe Products and Prices

### Option A: Using Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → **Add product**
3. Create the following products:

#### Pro Plan
- **Name**: Pro
- **Description**: Good for power users who want more projects and priority access
- **Price**: $10/month
- **Recurring**: Monthly subscription
- **Copy the Price ID** (starts with `price_`)

#### Team Plan
- **Name**: Team
- **Description**: For teams that need expanded collaboration and more projects
- **Price**: $30/month
- **Recurring**: Monthly subscription
- **Copy the Price ID** (starts with `price_`)

### Option B: Using Stripe CLI

```bash
# Create Pro product and price
stripe products create --name="Pro" --description="Good for power users who want more projects and priority access"
stripe prices create --product=<PRODUCT_ID> --unit-amount=1000 --currency=usd --recurring-interval=month

# Create Team product and price
stripe products create --name="Team" --description="For teams that need expanded collaboration and more projects"
stripe prices create --product=<PRODUCT_ID> --unit-amount=3000 --currency=usd --recurring-interval=month
```

## Step 2: Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_PRO=price_...
NEXT_PUBLIC_STRIPE_PRICE_TEAM=price_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Get your Stripe Secret Key
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API keys**
3. Copy the **Secret key** (starts with `sk_test_` for test mode)

### Set up Webhook Secret
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Click **Add endpoint**
4. For local development, use: `https://your-domain.com/api/stripe/webhook`
5. For production, use your actual domain
6. Select events to listen for:
   - `checkout.session.completed`
   - `invoice.payment_failed`
7. Copy the **Webhook signing secret** (starts with `whsec_`)

## Step 3: Set up Webhook for Local Development

### Using Stripe CLI (Recommended)

```bash
# Install Stripe CLI
# Mac: brew install stripe/stripe-cli/stripe
# Windows: Download from https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will give you a webhook secret that you can use in your `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_... (from stripe listen output)
```

### Alternative: Using ngrok

```bash
# Install ngrok
# Download from https://ngrok.com

# Start ngrok
ngrok http 3000

# Use the ngrok URL in Stripe Dashboard webhook setup
# https://your-ngrok-url.ngrok.io/api/stripe/webhook
```

## Step 4: Test the Subscription Flow

### Manual Testing

1. Start your development server:
```bash
npm run dev
```

2. Sign in to your kvelpo app
3. Navigate to `/profile/subscription`
4. Click "Choose plan" for Pro or Team
5. Complete the Stripe checkout (use test card: 4242 4242 4242 4242)
6. Verify you're redirected back with success message
7. Check that your membership is updated in the database

### Using Stripe Test Cards

Use these test cards for testing:

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Insufficient funds**: 4000 0000 0000 9995
- **Expired card**: 4000 0000 0000 0069

Use any future expiry date and any 3-digit CVC.

## Step 5: Verify Database Updates

Check that the subscription updates are working:

```sql
-- Check user membership
SELECT * FROM kvelpo_profile WHERE clerk_user_id = 'your_user_id';

-- Verify Stripe fields are populated
SELECT 
  membership,
  stripe_customer_id,
  stripe_subscription_id,
  subscription_start_date,
  subscription_end_date
FROM kvelpo_profile 
WHERE clerk_user_id = 'your_user_id';
```

## Step 6: Monitor Webhook Events

In your terminal (where stripe listen is running), you'll see webhook events:

```bash
# Successful checkout
checkout.session_completed  [evt_xxx]

# Payment failures
invoice.payment_failed      [evt_xxx]
```

## Troubleshooting

### Webhook not firing
- Ensure Stripe CLI is running with `stripe listen`
- Check the webhook URL matches your local server
- Verify the webhook secret in `.env.local` matches

### Checkout fails
- Check that Stripe secret key is correct
- Verify price IDs match your Stripe products
- Check browser console for errors

### Membership not updating
- Check webhook logs for errors
- Verify database connection
- Check that user ID matches between Clerk and webhook metadata

### Test mode vs Live mode
- Ensure you're using test keys for development
- For production, use live keys and update webhook endpoint
- Products and prices are different between test and live modes

## Production Deployment

For production deployment:

1. **Create live products and prices** in Stripe Dashboard
2. **Update environment variables** with live keys:
   ```env
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PRICE_PRO=price_... (live price)
   NEXT_PUBLIC_STRIPE_PRICE_TEAM=price_... (live price)
   ```
3. **Set up production webhook**:
   - Use your production domain: `https://yourdomain.com/api/stripe/webhook`
   - Update `STRIPE_WEBHOOK_SECRET` with production webhook secret
4. **Update `NEXT_PUBLIC_APP_URL`** to your production domain

## Current Implementation

The subscription system currently includes:

- ✅ Stripe checkout session creation
- ✅ Webhook handling for subscription updates
- ✅ Database updates for membership status
- ✅ Subscription period tracking
- ✅ Client-side subscription UI
- ✅ Session verification on success redirect

## Membership Limits

The system enforces these project limits based on membership:

- **Free**: 1 project
- **Pro**: 3 projects  
- **Team**: 10 projects

These limits are enforced in the projects API (`src/app/api/projects/route.ts`).
