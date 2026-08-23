// KOANO document engine — data assembler.
// One assembler for all document types. Given a document's requiredBlocks and a
// subject address, it geocodes once and fetches those blocks through the SAME
// shared provider-block layer the dashboard uses (no second data path), keeping
// every block's provenance envelope intact so it rides into the rendered figure
// and the provenance appendix.

import { registry } from '../providers/registry';
import { fetchBlocks, type BlockKey, type SiteDetailBlock } from '../providers/blocks';
import { supabaseAdmin } from '../supabase/server';
import type { Provenance } from '../providers/types';
import type { DocumentData, Letterhead } from './types';

// weakest = any representative input makes the whole document representative.
// Kept local so the documents module carries no dependency on the agent layer.
function weakest(blocks: Partial<Record<BlockKey, SiteDetailBlock<unknown>>>): Provenance {
  return Object.values(blocks).some((b) => b && b.provenance === 'representative')
    ? 'representative'
    : 'live';
}

export type AssembleResult =
  | { ok: true; data: DocumentData }
  | { ok: false; status: number; error: string };

// Geocode + fetch the document's required blocks. Returns a clean 422 if the
// address cannot be resolved (mirrors the site-detail route's contract).
export async function assembleDocumentData(
  address: string,
  requiredBlocks: BlockKey[],
): Promise<AssembleResult> {
  const geo = await registry.geocode.resolve(address);
  if (!geo.ok || !geo.data) {
    return {
      ok: false,
      status: 422,
      error: `Geocoding failed for "${address}": ${geo.error ?? 'no data'}`,
    };
  }
  const addr = geo.data;

  // De-dupe defensively; a registry entry should never repeat a block.
  const blockKeys = Array.from(new Set(requiredBlocks));
  const blocks = await fetchBlocks(addr, blockKeys);

  const data: DocumentData = {
    resolved_address: {
      input: addr.input,
      normalized: addr.normalized,
      bbl: addr.bbl,
      borough: addr.borough,
      tract_geoid: addr.tract_geoid,
      location_confidence: addr.location_confidence,
    },
    blocks,
    overall_provenance: weakest(blocks),
    assembled_at: new Date().toISOString(),
  };

  return { ok: true, data };
}

// Load the professional-identity fields that fill a document's letterhead
// (migration 005). A missing profile row or missing column yields all-null,
// which the renderer simply omits — letterhead is never a hard requirement.
export async function getLetterhead(userId: string): Promise<Letterhead> {
  const empty: Letterhead = {
    full_name: null,
    company_name: null,
    license_number: null,
    phone: null,
    contact_email: null,
    logo_url: null,
    headshot_url: null,
  };
  try {
    const { data, error } = await supabaseAdmin()
      .from('profiles')
      .select('full_name, company_name, license_number, phone, contact_email, logo_url, headshot_url')
      .eq('clerk_user_id', userId)
      .maybeSingle();
    if (error || !data) return empty;
    return {
      full_name: data.full_name ?? null,
      company_name: data.company_name ?? null,
      license_number: data.license_number ?? null,
      phone: data.phone ?? null,
      contact_email: data.contact_email ?? null,
      logo_url: data.logo_url ?? null,
      headshot_url: data.headshot_url ?? null,
    };
  } catch {
    // Letterhead is cosmetic; never fail a document over it.
    return empty;
  }
}
