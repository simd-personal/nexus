import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSiteUrlFromRequest } from '@/lib/auth/site-url';
import { getOrCreateStripeCustomer } from '@/lib/billing/customer';
import { getStripe } from '@/lib/stripe/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, full_name')
      .eq('user_id', user.id)
      .single();

    const customerId =
      profile?.stripe_customer_id ??
      (await getOrCreateStripeCustomer({
        userId: user.id,
        email: user.email ?? '',
        fullName: profile?.full_name,
      }));

    const siteUrl = getSiteUrlFromRequest(request);
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe portal error:', error);
    return NextResponse.json({ error: 'Could not open billing portal' }, { status: 500 });
  }
}
