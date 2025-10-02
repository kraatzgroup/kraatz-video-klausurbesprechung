#!/bin/bash

# Deploy Stripe Webhook Edge Function (erweitert um Customer Events)
# This script deploys the stripe-webhook function to Supabase

echo "🚀 Deploying Stripe Webhook Edge Function (mit Customer Events)..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/functions/stripe-webhook/index.ts" ]; then
    echo "❌ stripe-webhook function not found. Make sure you're in the project root directory."
    exit 1
fi

# Deploy the function
echo "📦 Deploying function to Supabase..."
supabase functions deploy stripe-webhook

if [ $? -eq 0 ]; then
    echo "✅ Successfully deployed stripe-webhook function!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Environment Variables sind bereits konfiguriert:"
    echo "   - STRIPE_SECRET_KEY ✅"
    echo "   - STRIPE_WEBHOOK_SECRET ✅"
    echo ""
    echo "2. Erweitere Stripe Webhook um Customer Events:"
    echo "   - URL: https://rpgbyockvpannrupicno.supabase.co/functions/v1/stripe-webhook"
    echo "   - Events: customer.created, customer.updated (zusätzlich zu bestehenden)"
    echo ""
    echo "3. Teste mit Customer-Erstellung in Stripe"
else
    echo "❌ Failed to deploy stripe-webhook function"
    exit 1
fi
