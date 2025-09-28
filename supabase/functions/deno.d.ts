// Type definitions for Deno runtime in Supabase Edge Functions

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
  export const env: Env;
}

// Module declarations for Deno imports
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(supabaseUrl: string, supabaseKey: string, options?: any): any;
}

declare module "https://esm.sh/stripe@14.21.0" {
  interface StripeInstance {
    paymentIntents: {
      create(params: any): Promise<any>;
      retrieve(id: string): Promise<any>;
    };
    checkout: {
      sessions: {
        create(params: any): Promise<any>;
      };
    };
    webhooks: {
      constructEvent(body: string, signature: string, secret: string): any;
      constructEventAsync(body: string, signature: string, secret: string): Promise<any>;
    };
    billingPortal: {
      sessions: {
        create(params: any): Promise<any>;
      };
    };
    customers: {
      list(params: any): Promise<any>;
      create(params: any): Promise<any>;
    };
    invoices: {
      create(params: any): Promise<any>;
      finalizeInvoice(id: string): Promise<any>;
    };
    invoiceItems: {
      create(params: any): Promise<any>;
    };
  }

  interface StripeConstructor {
    new (secretKey: string, options?: any): StripeInstance;
  }
  
  namespace Stripe {
    interface Event {
      id: string;
      type: string;
      data: {
        object: any;
      };
    }
    
    interface PaymentIntent {
      id: string;
      status: string;
      amount: number;
      metadata: Record<string, string>;
    }
  }
  
  const Stripe: StripeConstructor;
  export = Stripe;
}
