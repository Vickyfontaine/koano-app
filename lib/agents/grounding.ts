// KOANO provenance grounding — the always-on detector (Option A).
//
// The structural citation test (a cited source NAME exists among the data
// points) passes on semantically false claims: an agent expanded the single
// datum `special_district = "G"` into "Gowanus … Mandatory Inclusionary Housing
// … Gowanus Superfund site … adopted 2021", all under a valid MapPLUTO citation.
// This module closes that gap with a content check: every SPECIFIC claim token
// in an observation — a capitalized proper noun / named entity, an all-caps
// acronym, or a year — must trace to a value the agent actually received, the
// subject address, a short common vocabulary, or a DOCUMENTED standard
// code-definition. Anything else is forbidden and surfaced, never dropped.

import type { DataPoint } from '../providers/types';

// Shown IN the reasoning chain in place of an ungrounded observation. The chain
// is visibly incomplete rather than silently short a step (same integrity rule
// as the non-bypassable disclaimer): the reader must know a claim was withheld.
export const WITHHELD_OBSERVATION =
  '[Observation withheld] A specific claim in this step could not be traced to any cited data source, so it was removed. This reasoning chain is deliberately incomplete here rather than assert an unverifiable fact.';

// Documented, stable code→meaning mappings an agent MAY state as a standard
// definition (NOT a property-specific claim). This is the explicit allowlist the
// amendment calls for: it distinguishes "class C means immediately hazardous"
// (a fixed definition) from "the Gowanus Superfund site" (an unsourced entity).
// Extend DELIBERATELY. Anything capitalized that is neither here nor in the data
// points is forbidden — so the rule is "state documented definitions only,"
// never "never explain any code."
//
// NOTE: most standard definitions (HPD class severities "immediately hazardous",
// building-class descriptions "walk-up apartment", zoning families "manufacturing")
// are lowercase common nouns and pass without an entry here — only capitalized
// standard phrases need listing.
export const STANDARD_DEFINITIONS: string[] = [
  'special flood hazard area', // FEMA zone AE/VE/A meaning
];

// Generic vocabulary that is legitimate in any observation (function words,
// agency/acronym names, months, directions, units, and non-entity real-estate
// terms). Deliberately excludes any place/program/statute NAME.
const COMMON_VOCAB = new Set<string>([
  // function words
  'the','a','an','of','in','on','at','to','for','and','or','but','with','as','is','are','was','were','this','that','these','those','it','its','by','from','than','then','not','no','be','been','has','have','had','which','where','when','while','into','under','over','above','below','per','via','vs','already','confirmed','confirms','signals','indicates','suggests','reflects','recorded','issued','pulled','active','subject','parcel','lot','site','property','area','tract','neighborhood','local','both','one','two','three','only','well','above','below','mid','late','early','cycle',
  // agencies / acronyms legitimate everywhere
  'koano','nyc','ny','usa','dob','now','build','hpd','ecb','fema','irs','fhfa','pluto','mappluto','acs','census','dof','far','bbl','bin','zip','soda','oz','nfhl','sfha',
  // standard address / time abbreviations (not named entities)
  'st','ave','blvd','rd','ste','dr','ln','ytd','q1','q2','q3','q4',
  // months
  'january','february','march','april','may','june','july','august','september','october','november','december',
  // directions
  'north','south','east','west','northeast','northwest','southeast','southwest',
  // verdict + non-entity real-estate terms
  'buy','sell','hold','wait','drop','verdict','confidence','risk','score','permit','permits','foundation','demolition','alteration','new','construction','excavation','support','fence','protection','mechanical','methods','sign','scaffold','sidewalk','shed','full','zoning','district','overlay','special','residential','commercial','manufacturing','mixed','use','building','class','flood','zone','hazard','violation','violations','open','owner','ownership','portfolio','speculation','watch','list','registered','market','sales','sale','median','price','prices','priced','pricing','value','values','unused','development','rights','entitlement','opportunity','federal','designation','street','avenue','boulevard','road','place','brooklyn','queens','bronx','manhattan','staten','island','long','city','sq','ft','square','feet','year','years','built','units','unit','months','month','crime','foot','traffic','search','interest','demand','sentiment','demographic','income','rent','population','index','metro','yoy',
  // number words (appear sentence-initially, e.g. "Ten demolition permits…")
  'zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety','hundred','thousand','million','billion',
  // common English words that can appear capitalized (mostly sentence-initial),
  // so a common word never reads as a named entity. A real entity still fails
  // because it carries a novel token (e.g. "Inclusionary", "Gowanus").
  'absence','presence','multiple','several','many','few','some','all','most','more','less','much','little','given','taken','combined','offset','paired','coupled','together','across','within','without','despite','although','though','because','since','unlike','beyond','regarding','considering','additionally','however','overall','notably','further','moreover','meanwhile','also','thus','hence','therefore','whereas','about','after','before','during','between','among','against','toward','towards','upon','each','any','every','either','neither','such','same','other','another','high','low','strong','weak','positive','negative','neutral','meaningful','material','significant','modest','mild','moderate','elevated','near','far','here','there','recent','current','latent','hypothetical','underway','executing','committed','capital','signal','indicator','leading','forward','downside','upside','momentum','transition','transitioning','stage','profile','posture','context','constraint','constraints','requirement','requirements','timeline','timelines','cost','basis','dual','account','accounts','carries','carry','offering','offer','real','standing','stock','coverage','note','scope','area','wide','level','trend','rising','falling','flat','stable','static','dense','density','industrial','garage','storage','loft','walk','apartment','rental','rentals','tenant','tenants','affordable','affordability','design','controls','remediation','environmental','concern','concerns','strongest','stronger','strong','clear','clearly','likely','unlikely','worth','reviewing','review','flag','diligence','indicative','apparent','evident',
  // A broad common-English + real-estate/finance vocabulary so ordinary words —
  // which the model routinely capitalizes at the start of a sentence — never
  // read as named entities. A genuine entity (Gowanus, Superfund, Inclusionary)
  // still fails because it is NOT a common word. Add freely; never add a place,
  // program, or statute name here.
  'nearby','adjacent','surrounding','elsewhere','local','locally','regionally','citywide','onsite','offsite','nearer','farther','closer','proximate','proximity',
  'they','them','their','theirs','we','our','ours','you','your','it','he','she','his','her','who','whom','whose','what','why','how','which','when','where','can','could','should','would','may','might','must','will','shall','do','does','did','done','make','makes','made','made','get','gets','got','put','set','take','takes','took','give','gives','gave','show','shows','showed','see','seen','saw','read','reads','known','know','knows','think','thinks','treat','treated','treating','treats','base','based','drive','driven','drives','tie','tied','ties','link','linked','links','relate','related','associate','associated','pending','ongoing','active','inactive','dynamic','volatile','mixed','compressed','narrow','massive','large','small','larger','smaller','higher','lower','bigger','greater','lesser','minor','major','primary','secondary','key','core','central','broad','narrower','overall','partial','total','net','gross','average','median','mean','typical','standard','normal','unusual','notable','remarkable','considerable','substantial','sizable','ample','limited','scarce','abundant','liquidity','liquid','illiquid','solvency','leverage','equity','debt','yield','return','returns','cap','rate','rates','pricing','priced','appreciate','appreciated','appreciation','depreciation','absorption','velocity','valuation','valuations','dispersion','spread','printing','prints','closed','closing','transaction','transactions','pool','turnover','inventory','supply','demand','gentrification','displacement','reinvestment','redevelopment','renovation','maintenance','deterioration','deteriorating','improving','stabilizing','stabilization','characterize','characterizes','characterized','support','supports','supported','supporting','component','components','effect','effects','play','plays','holding','holdings','asset','assets','deal','deals','buyer','buyers','seller','sellers','lender','lenders','investor','investors','operator','operators','landlord','institutional','commercial','marketplace','submarket','submarkets','block','blocks','parcel','parcels','lots','address','addresses','recorded','present','future','past','earlier','later','ago','today','yesterday','tomorrow','monthly','quarterly','annually','yearly','weekly','daily','moment','timing','window','horizon','term','short','medium','longer','decade','decades','quarter','quarters','half','third','fourth','fifth','tenth','percent','percentage','point','points','figure','figures','number','numbers','count','counts','total','totals','sum','amount','amounts','ratio','ratios','share','shares','portion','fraction','majority','minority','multiple','multiples','pattern','patterns','picture','read','reading','readings','takeaway','bottom','line','summary','conclusion','assessment','analysis','view','perspective','angle','lens','frame','framing',
]);

function tokensOf(s: string): string[] {
  return s.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

// The allowed-token universe for one grounding check: every token the agent
// actually received (data point labels + values + source names), the subject
// address, the common vocabulary, and the standard-definitions allowlist.
export function buildAllowedTokens(dataPoints: DataPoint[], addressLabel: string): Set<string> {
  const s = new Set<string>(COMMON_VOCAB);
  for (const t of tokensOf(addressLabel)) s.add(t);
  for (const def of STANDARD_DEFINITIONS) for (const t of tokensOf(def)) s.add(t);
  for (const dp of dataPoints) {
    for (const t of tokensOf(dp.label)) s.add(t);
    for (const t of tokensOf(String(dp.value ?? ''))) s.add(t);
    for (const t of tokensOf(dp.source ?? '')) s.add(t);
  }
  return s;
}

// Candidate "specific claims": capitalized proper-noun phrases, all-caps
// acronyms (>=2 letters, e.g. MIH), and 4-digit years.
function candidateClaims(observation: string): string[] {
  const out: string[] = [];
  const properNoun = /\b[A-Z][a-zA-Z]+(?:\s+(?:of\s+|the\s+)?[A-Z][a-zA-Z]+)*\b/g;
  const acronym = /\b[A-Z]{2,}\b/g;
  const year = /\b(?:19|20)\d{2}\b/g;
  for (const re of [properNoun, acronym, year]) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(observation))) out.push(m[0]);
  }
  return out;
}

export interface GroundingResult {
  grounded: boolean;
  ungrounded: string[]; // the specific untraceable phrases
}

// A candidate is grounded if EVERY component token is in the allowed universe.
// "Gowanus Special District" fails on `gowanus`; "Special Flood Hazard Area"
// passes (its tokens are in the flood data point's label / the allowlist);
// "Foundation" passes; "2021" fails unless a data point carries that year.
export function groundObservation(observation: string, allowed: Set<string>): GroundingResult {
  const ungrounded: string[] = [];
  for (const cand of candidateClaims(observation)) {
    const ok = tokensOf(cand).every((t) => allowed.has(t));
    if (!ok) ungrounded.push(cand);
  }
  const uniq = Array.from(new Set(ungrounded));
  return { grounded: uniq.length === 0, ungrounded: uniq };
}
