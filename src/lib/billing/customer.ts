import { createServiceClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';

export async function getOrCreateStripeCustomer(input: {
  userId: string;
  email: string;
  fullName?: string | null;
}): Promise<string> {
  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, full_name')
    .eq('user_id', input.userId)
    .single();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: input.email,
    name: input.fullName?.trim() || profile?.full_name?.trim() || undefined,
    metadata: {
      supabase_user_id: input.userId,
    },
  });

  await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('user_id', input.userId);

  return customer.id;
}
