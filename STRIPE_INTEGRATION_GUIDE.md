# Stripe Integration Guide

## Overview

This guide provides complete instructions for setting up and deploying the Stripe payment integration for the Kraatz Club application.

## 🎯 What's Been Implemented

### Frontend Components
- **StripeCheckout Component**: Complete checkout flow with card payment
- **PackagesPage**: Updated to use real Stripe integration
- **Payment Success/Failure Handling**: User feedback and navigation

### Backend Infrastructure
- **Supabase Edge Functions**: 
  - `create-payment-intent`: Creates Stripe payment intents
  - `confirm-payment`: Processes successful payments and updates user credits
  - `stripe-webhook`: Handles Stripe webhook events for reliability

### Database Schema
- **packages table**: Stores available packages with Stripe price IDs
- **orders table**: Tracks payment transactions
- **Enhanced users table**: Account credits system

## 🔧 Setup Instructions

### 1. Environment Variables

Update your `.env` file with the Stripe keys provided:

```env
# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
```

### 2. Database Setup

The packages have been set up in your database with the following structure:

| Package | Case Studies | Price | Package Key |
|---------|-------------|-------|-------------|
| 5er Paket | 5 | €675 | 5er |
| 10er Paket | 10 | €1,250 | 10er |
| 15er Paket | 15 | €1,800 | 15er |
| 20er Paket | 20 | €2,360 | 20er |
| 25er Paket | 25 | €2,875 | 25er |
| 30er Paket | 30 | €3,375 | 30er |

### 3. Stripe Dashboard Configuration

#### Create Products and Prices in Stripe:

1. **Log into Stripe Dashboard**
2. **Go to Products section**
3. **Create products for each package:**

```
Product: 5er Paket Kraatz Club
Description: 5 Klausuren mit Videobesprechung
Price: €675.00 (one-time payment)
Price ID: Copy this and update database

Product: 10er Paket Kraatz Club
Description: 10 Klausuren mit Videobesprechung  
Price: €1,250.00 (one-time payment)
Price ID: Copy this and update database

... (repeat for all packages)
```

#### Update Database with Stripe Price IDs:

```sql
-- Update each package with the actual Stripe price ID
UPDATE packages SET stripe_price_id = 'price_ACTUAL_STRIPE_PRICE_ID' WHERE package_key = '5er';
UPDATE packages SET stripe_price_id = 'price_ACTUAL_STRIPE_PRICE_ID' WHERE package_key = '10er';
-- ... repeat for all packages
```

### 4. Deploy Supabase Edge Functions

```bash
# Deploy the payment processing functions
supabase functions deploy create-payment-intent
supabase functions deploy confirm-payment  
supabase functions deploy stripe-webhook

# Set environment variables for Edge Functions
supabase secrets set STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
```

### 5. Configure Stripe Webhooks

1. **In Stripe Dashboard, go to Webhooks**
2. **Add endpoint**: `https://your-project-id.supabase.co/functions/v1/stripe-webhook`
3. **Select events to listen for:**
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. **Copy the webhook signing secret**
5. **Set the webhook secret in Supabase:**

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## 💳 Payment Flow

### User Experience:
1. **Browse Packages**: User sees available packages on `/packages` page
2. **Select Package**: Click "Jetzt kaufen" button
3. **Stripe Checkout**: Secure card payment form
4. **Payment Processing**: Real-time payment with Stripe
5. **Success**: Credits added to account, redirect to dashboard
6. **Failure**: Error message, option to retry

### Technical Flow:
1. **Frontend**: Create payment intent via Edge Function
2. **Backend**: Stripe payment intent created, order record saved
3. **Stripe**: User completes payment
4. **Webhook**: Stripe notifies our webhook of success/failure
5. **Backend**: Update order status, add credits to user account
6. **Frontend**: Show success message and redirect

## 🔍 Testing

### Test Mode Setup:
1. **Use Stripe test keys** for development
2. **Test card numbers**:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0000 0000 3220`

### Production Checklist:
- [ ] Live Stripe keys configured
- [ ] Webhook endpoint configured with live events
- [ ] Edge Functions deployed with production secrets
- [ ] Database packages updated with live Stripe price IDs
- [ ] SSL certificate valid for webhook endpoint

## 🚨 Security Considerations

### Environment Variables:
- **Never commit** Stripe secret keys to version control
- **Use Supabase secrets** for Edge Function environment variables
- **Validate webhook signatures** to prevent fraud

### Payment Security:
- **PCI Compliance**: Stripe handles all card data
- **HTTPS Only**: All payment endpoints use SSL
- **Webhook Verification**: All webhooks verified with Stripe signature

## 📊 Monitoring

### Key Metrics to Monitor:
- **Payment Success Rate**: Track successful vs failed payments
- **User Credit Updates**: Ensure credits are properly added
- **Webhook Delivery**: Monitor webhook success in Stripe dashboard
- **Error Rates**: Watch Edge Function logs for errors

### Logs to Check:
- **Supabase Edge Function logs**: Payment processing errors
- **Stripe Dashboard**: Payment and webhook events
- **Browser Console**: Frontend payment errors

## 🔧 Troubleshooting

### Common Issues:

#### "Payment Intent Creation Failed"
- Check Stripe secret key in Edge Function environment
- Verify package exists and is active in database
- Check Edge Function logs for detailed error

#### "Webhook Signature Verification Failed"  
- Verify webhook secret is correctly set
- Check webhook endpoint URL is correct
- Ensure webhook is configured for correct events

#### "Credits Not Added After Payment"
- Check webhook delivery in Stripe dashboard
- Verify webhook processing in Edge Function logs
- Check order status in database

#### "Package Not Found"
- Verify packages exist in database
- Check package_key matches frontend selection
- Ensure packages are marked as active

## 📞 Support

For technical issues:
1. **Check Edge Function logs** in Supabase dashboard
2. **Review Stripe webhook logs** for payment events
3. **Verify database state** for orders and user credits
4. **Test with Stripe test cards** to isolate issues

## 🎉 Go Live Checklist

- [ ] Stripe live keys configured in environment
- [ ] All Edge Functions deployed with live secrets
- [ ] Webhook endpoint configured with live events
- [ ] Database packages updated with live Stripe price IDs
- [ ] Payment flow tested end-to-end
- [ ] Error handling tested
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for team

---

**The Stripe integration is now complete and ready for deployment!** 🚀
