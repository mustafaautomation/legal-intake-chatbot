const ADVICE_PATTERNS = [
  /\bshould i\b/i,
  /\bwhat should i\b/i,
  /\bwhat do i say\b/i,
  /\bdo i have a (good |strong )?case\b/i,
  /\bwhat are my (chances|odds)\b/i,
  /\bwill i win\b/i,
  /\bam i going to win\b/i,
  /\bhow much (is|are) my (case|claim) worth\b/i,
  /\bcan i sue\b/i,
  /\bwhether (i should|to) (accept|settle|sue|sign|take)\b/i,
  /\b(accept|settle) the (insurance |company's |first )?offer\b/i,
  /\bdraft (me )?(a |the )?(demand|complaint|motion|letter)\b/i,
  /\bwrite (me )?(a |the )?(demand|letter|motion|complaint)\b/i,
  /\bis (this|it|that) illegal\b/i,
  /\bgive me legal advice\b/i,
  /\bwhat would (a lawyer|you) advise\b/i,
  /\btell me if i (should|can|will)\b/i,
  /\bpredict (the )?outcome\b/i,
  /\b(is|are) my claim (still )?(timely|valid|too late)\b/i,
  /\bdo i still have time\b/i,
  /\bis it too late for (my|me)\b/i,
];

export function isLegalAdviceRequest(text: string): boolean {
  if (/\bwhat should i bring\b/i.test(text)) return false;
  return ADVICE_PATTERNS.some((pattern) => pattern.test(text));
}

export function isFirmQuestion(text: string): boolean {
  if (isIncidentNarrative(text) && !/^\s*(what|how|who|where|when|do you|can you|is this chat)\b/i.test(text)) {
    return false;
  }
  return (
    /\?/.test(text) ||
    /^\s*(what|how|who|where|when|do you|can you|is this|are you|tell me about)\b/i.test(text)
  ) &&
    /\b(fee|fees|charge|contingenc|hourly|flat fee|attorney|lawyer|who handles|bring|consultation|consult|statute|limitations|how long|confidential|privileged|hours|address|where are you|office|practice area|criminal|immigration matters|spanish)\b/i.test(
      text,
    );
}

export function isIncidentNarrative(text: string): boolean {
  return /\b(i was|i am|i'm|i’ve|i've|i have been|my (husband|wife|employer|boss|child|brother|sister)|fired me|rear-ended|rear ended|slipped|arrested|in detention)\b/i.test(
    text,
  );
}

export function wantsHuman(text: string): boolean {
  return /\b(talk to (a )?(human|person|lawyer|someone|operator|representative)|speak to (a )?(human|person|lawyer)|real person|hand\s?off)\b/i.test(
    text,
  );
}

export function isFrustrated(text: string): boolean {
  return /\b(useless|not helping|this is ridiculous|waste of time|forget it|terrible (bot|chat)|stupid (bot|chat))\b/i.test(text);
}

export function isOffTopic(text: string): boolean {
  return /\b(weather|recipe|poem|joke|world cup|capital of|stock price|write (me )?code|python script|homework|movie|celebrity|lyrics)\b/i.test(
    text,
  );
}

export function isPromptInjection(text: string): boolean {
  return /\b(ignore (all |any |previous |your )?(instructions|rules)|system prompt|you are now|developer mode|jailbreak)\b/i.test(text);
}

export function isUngroundedQuestion(text: string): boolean {
  if (isIncidentNarrative(text)) return false;
  return /\?\s*$/.test(text) || /^\s*(what|how|who|where|when|do you|can you)\b/i.test(text);
}

export function isOutOfScopeRequest(text: string): boolean {
  if (/\bdo you (handle|take|do)\b/i.test(text)) return false;
  return /\b(dui|criminal defense|arrested|bankruptcy|patent|tax fraud|real estate closing)\b/i.test(text);
}

export const ADVICE_REFUSAL = [
  "I can’t answer that.",
  "Harlow & Pierce’s intake assistant does not give legal advice, predict an outcome, value a claim, draft a demand, or tell you what to say.",
  "This is not legal advice and does not create an attorney-client relationship.",
  "A lawyer can talk about strategy in a consultation, after a conflict screen.",
].join(" ");
