// No em dashes in what KOANO writes (house rule for user-facing copy). The
// narrator and the writers are told so in their prompts; this guard enforces it
// on every model-written sentence before it is stored or shown, because a prompt
// instruction alone is not a guarantee.
//
//   "Strong demand — permits are up"   -> "Strong demand, permits are up"
//   "Strong demand—permits are up"     -> "Strong demand, permits are up"
//   "Strong demand – permits are up"   -> "Strong demand, permits are up" (spaced en dash used as a dash)
//   "a 2–3 year window"                -> unchanged (an en dash in a numeric range)
//   "— Market timing leads"            -> "Market timing leads" (a leading dash)
//   "the panel agrees —"               -> "the panel agrees." (a trailing dash)

export function withoutEmDashes(text: string): string {
  if (!text) return text;
  let s = text
    // a dash opening a line or the text
    .replace(/(^|\n)[ \t]*[—―][ \t]*/g, '$1')
    // a dash closing the text or a line
    .replace(/[ \t]*[—―][ \t]*(?=\n|$)/g, '.')
    // em dash (spaced or not) and the spaced en dash used as a dash, mid-sentence
    .replace(/[ \t]*[—―][ \t]*/g, ', ')
    .replace(/[ \t]+–[ \t]+/g, ', ');
  // tidy what the replacement can leave behind
  s = s.replace(/,\s*([,.;:!?])/g, '$1').replace(/\.{2,}/g, '.').replace(/[ \t]{2,}/g, ' ');
  return s;
}
