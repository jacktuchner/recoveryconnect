import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const faqPrompts = [
  // WEEKLY_TIMELINE
  { question: "How did you feel 24 hours after surgery?", category: "WEEKLY_TIMELINE", sortOrder: 1 },
  { question: "What was week 1 of recovery like?", category: "WEEKLY_TIMELINE", sortOrder: 2 },
  { question: "What changed between week 2 and week 4?", category: "WEEKLY_TIMELINE", sortOrder: 3 },
  { question: "What were months 2-3 like in your recovery?", category: "WEEKLY_TIMELINE", sortOrder: 4 },

  // PRACTICAL_TIPS
  { question: "Tips for caring for your other arm during recovery?", category: "PRACTICAL_TIPS", sortOrder: 1 },
  { question: "How did you handle showering and personal care?", category: "PRACTICAL_TIPS", sortOrder: 2 },
  { question: "What sleep positions worked best for you?", category: "PRACTICAL_TIPS", sortOrder: 3 },
  { question: "What equipment or tools made recovery easier?", category: "PRACTICAL_TIPS", sortOrder: 4 },

  // WISH_I_KNEW
  { question: "What do you wish someone had told you before surgery?", category: "WISH_I_KNEW", sortOrder: 1 },
  { question: "What surprised you most about recovery?", category: "WISH_I_KNEW", sortOrder: 2 },
  { question: "What would you do differently if you could start over?", category: "WISH_I_KNEW", sortOrder: 3 },

  // MENTAL_HEALTH
  { question: "How did you cope with the emotional side of recovery?", category: "MENTAL_HEALTH", sortOrder: 1 },
  { question: "How did you deal with frustration during setbacks?", category: "MENTAL_HEALTH", sortOrder: 2 },
  { question: "What helped you stay positive during recovery?", category: "MENTAL_HEALTH", sortOrder: 3 },

  // RETURN_TO_ACTIVITY
  { question: "When did you return to your sport/activity?", category: "RETURN_TO_ACTIVITY", sortOrder: 1 },
  { question: "What was your first workout back like?", category: "RETURN_TO_ACTIVITY", sortOrder: 2 },
  { question: "How did you know you were ready to return to activity?", category: "RETURN_TO_ACTIVITY", sortOrder: 3 },

  // MISTAKES_AND_LESSONS
  { question: "What mistakes did you make during recovery?", category: "MISTAKES_AND_LESSONS", sortOrder: 1 },
  { question: "What's one thing you overdid that set you back?", category: "MISTAKES_AND_LESSONS", sortOrder: 2 },
];

export async function POST() {
  try {
    let created = 0;

    for (const prompt of faqPrompts) {
      const id = `${prompt.category}-${prompt.sortOrder}`;
      const { error } = await supabase
        .from("FaqPrompt")
        .upsert({
          id,
          question: prompt.question,
          category: prompt.category,
          sortOrder: prompt.sortOrder,
          isActive: true,
          createdAt: new Date().toISOString(),
        }, {
          onConflict: "id",
        });

      if (error) throw error;
      created++;
    }

    return NextResponse.json({ success: true, created });
  } catch (error) {
    console.error("Error seeding prompts:", error);
    return NextResponse.json(
      { error: "Failed to seed prompts", details: String(error) },
      { status: 500 }
    );
  }
}
