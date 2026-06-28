import type { SupabaseClient } from '@supabase/supabase-js';
import type { OrganizationIndustry } from '@/types/database';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'organization';
}

export async function provisionEnterpriseOrganization(
  supabase: SupabaseClient,
  userId: string,
  organizationName: string,
  industry: OrganizationIndustry = 'other'
): Promise<{ organizationId: string | null; error?: string }> {
  const name = organizationName.trim();
  if (!name) return { organizationId: null, error: 'Organization name is required' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('default_organization_id, account_type')
    .eq('user_id', userId)
    .single();

  if (profile?.default_organization_id) {
    return { organizationId: profile.default_organization_id };
  }

  const phiProtectionEnabled = industry === 'healthcare';
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let attempt = 0;

  while (attempt < 5) {
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        slug,
        industry,
        phi_protection_enabled: phiProtectionEnabled,
        created_by: userId,
      })
      .select('id')
      .single();

    if (!orgError && org) {
      await supabase.from('organization_members').insert({
        organization_id: org.id,
        user_id: userId,
        role: 'owner',
        status: 'active',
      });

      await supabase
        .from('profiles')
        .update({
          account_type: 'enterprise',
          default_organization_id: org.id,
        })
        .eq('user_id', userId);

      await supabase.from('organization_audit_events').insert({
        organization_id: org.id,
        actor_id: userId,
        action: 'organization.created',
        metadata: { name, industry, phi_protection_enabled: phiProtectionEnabled },
      });

      return { organizationId: org.id };
    }

    if (orgError?.message.includes('slug')) {
      attempt += 1;
      slug = `${baseSlug}-${attempt}`;
      continue;
    }

    return { organizationId: null, error: orgError?.message ?? 'Could not create organization' };
  }

  return { organizationId: null, error: 'Could not create organization slug' };
}
