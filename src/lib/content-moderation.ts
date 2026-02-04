/**
 * Content Moderation System
 * Scans transcriptions for potentially dangerous medical directives
 */

export interface ContentFlag {
  flagType: string;
  flaggedText: string;
  context: string;
  severity: "low" | "medium" | "high";
}

// Patterns that suggest medical directives (not personal experience)
const DIRECTIVE_PATTERNS = [
  // Direct instructions
  { pattern: /\b(you\s+)?(must|need\s+to|should|have\s+to)\s+(take|stop|avoid|skip|ignore)/gi, type: "medical_directive", severity: "high" as const },
  { pattern: /\bdon'?t\s+(take|listen\s+to|follow|trust)\s+(your\s+)?(doctor|surgeon|physician|medical)/gi, type: "contradict_doctor", severity: "high" as const },
  { pattern: /\bignore\s+(what\s+)?(your\s+)?(doctor|surgeon|they)\s+(said|told|recommended)/gi, type: "contradict_doctor", severity: "high" as const },

  // Dosage and medication directives
  { pattern: /\b(take|use)\s+(\d+)\s*(mg|ml|pills?|tablets?|doses?)/gi, type: "dosage_advice", severity: "high" as const },
  { pattern: /\b(stop|quit|discontinue)\s+(taking\s+)?(your\s+)?(medication|meds|pills|prescription)/gi, type: "medication_directive", severity: "high" as const },
  { pattern: /\bdouble\s+(the\s+)?(dose|dosage|amount)/gi, type: "dosage_advice", severity: "high" as const },

  // Timeline directives that contradict standard care
  { pattern: /\b(only|just)\s+(need\s+to\s+)?(wait|rest|heal)\s+(for\s+)?(\d+)\s*(day|week|hour)/gi, type: "timeline_directive", severity: "medium" as const },
  { pattern: /\byou\s+(can|should)\s+(start|begin|resume)\s+.{0,30}\s+(after|in)\s+(\d+)\s*(day|week)/gi, type: "timeline_directive", severity: "medium" as const },

  // Weight bearing and activity directives
  { pattern: /\b(put|bear)\s+(full\s+)?weight\s+(on|immediately|right\s+away)/gi, type: "activity_directive", severity: "high" as const },
  { pattern: /\byou\s+(don'?t\s+)?need\s+(to\s+)?(use|wear)\s+(the\s+)?(brace|sling|crutches|boot)/gi, type: "equipment_directive", severity: "medium" as const },

  // Wound care directives
  { pattern: /\b(remove|take\s+off)\s+(the\s+)?(bandage|dressing|stitches|staples)/gi, type: "wound_care_directive", severity: "high" as const },
  { pattern: /\bget\s+(it|the\s+wound|incision)\s+wet\s+(right\s+away|immediately|before)/gi, type: "wound_care_directive", severity: "medium" as const },
];

// Phrases that indicate personal experience (good - these reduce flag severity)
const EXPERIENCE_INDICATORS = [
  /\b(in\s+)?my\s+(experience|case|situation)/gi,
  /\bfor\s+me\b/gi,
  /\bpersonally\b/gi,
  /\bi\s+(found|felt|noticed|experienced)/gi,
  /\bwhat\s+worked\s+for\s+me/gi,
  /\bmy\s+(doctor|surgeon)\s+(told|said|recommended)/gi,
  /\beveryone'?s?\s+(different|recovery\s+is\s+different)/gi,
  /\bthis\s+is\s+(just\s+)?my\s+(story|experience)/gi,
  /\bcheck\s+with\s+your\s+(doctor|surgeon|physician)/gi,
  /\balways\s+(consult|ask|check\s+with)/gi,
];

/**
 * Scan text for potentially dangerous content
 */
export function scanContent(text: string): ContentFlag[] {
  const flags: ContentFlag[] = [];

  if (!text) return flags;

  // Check for directive patterns
  for (const { pattern, type, severity } of DIRECTIVE_PATTERNS) {
    const matches = text.matchAll(new RegExp(pattern));

    for (const match of matches) {
      const matchIndex = match.index || 0;
      const contextStart = Math.max(0, matchIndex - 50);
      const contextEnd = Math.min(text.length, matchIndex + match[0].length + 50);
      const context = text.slice(contextStart, contextEnd);

      // Check if this section has experience indicators nearby (within 100 chars)
      const surroundingText = text.slice(
        Math.max(0, matchIndex - 100),
        Math.min(text.length, matchIndex + match[0].length + 100)
      );

      const hasExperienceIndicator = EXPERIENCE_INDICATORS.some(
        indicator => indicator.test(surroundingText)
      );

      // Reduce severity if framed as personal experience
      const adjustedSeverity = hasExperienceIndicator && severity === "high"
        ? "medium" as const
        : hasExperienceIndicator && severity === "medium"
          ? "low" as const
          : severity;

      flags.push({
        flagType: type,
        flaggedText: match[0],
        context: `...${context}...`,
        severity: adjustedSeverity,
      });
    }
  }

  return flags;
}

/**
 * Check if content should be auto-rejected (too many high severity flags)
 */
export function shouldAutoReject(flags: ContentFlag[]): boolean {
  const highSeverityCount = flags.filter(f => f.severity === "high").length;
  return highSeverityCount >= 3;
}

/**
 * Check if content needs manual review
 */
export function needsManualReview(flags: ContentFlag[]): boolean {
  return flags.some(f => f.severity === "high" || f.severity === "medium");
}

/**
 * Get a summary of content flags for display
 */
export function getFlagSummary(flags: ContentFlag[]): string {
  if (flags.length === 0) return "No concerns detected";

  const high = flags.filter(f => f.severity === "high").length;
  const medium = flags.filter(f => f.severity === "medium").length;
  const low = flags.filter(f => f.severity === "low").length;

  const parts = [];
  if (high > 0) parts.push(`${high} high-priority`);
  if (medium > 0) parts.push(`${medium} medium-priority`);
  if (low > 0) parts.push(`${low} low-priority`);

  return `${parts.join(", ")} concern${flags.length > 1 ? "s" : ""} detected`;
}
