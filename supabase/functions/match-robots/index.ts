import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ROBOT_CATALOG = `
Available Construction Humanoid Robot Types:

1. logistics_humanoid - Logistics Humanoid (ロジスティクス): Material transport, supply chain, waste removal, drywall/plywood/stud transport, fastener restocking
2. positioning_humanoid - Positioning Humanoid (位置決め): Drywall positioning, stud alignment, ceiling grid positioning, bracket/frame/rail alignment, cabinet positioning, material holding
3. installation_humanoid - Installation Humanoid (取り付け): Drywall screwing, bracket installation, cabinet mounting, temporary handrail/enclosure setup, repetitive drilling/anchoring
4. finishing_humanoid - Finishing Humanoid (仕上げ): Wall/ceiling painting, sanding, caulking/sealing, taping/mudding, floor preparation/leveling
5. maintenance_humanoid - Site Maintenance Humanoid (現場管理): Site cleaning, dust/debris removal, protection sheet management, tool organization, pre-work setup
6. inspection_humanoid - Inspection Humanoid (点検): Visual inspection, 360° camera, LiDAR scanning, thermal imaging, crack detection, NDT, predictive maintenance
7. scaffolding_humanoid - Scaffolding Humanoid (足場): Scaffold assembly/disassembly, scaffold component transport, safety net setup, elevated work support
8. demolition_humanoid - Demolition Humanoid (解体): Interior wall demolition, nail/screw/anchor removal, waste sorting, drywall/light steel framing removal
9. patrol_humanoid - Patrol Humanoid (監視): Night patrol, intruder detection, fire/water leak detection, video/log recording, 24/7 monitoring
10. measurement_humanoid - Measurement Humanoid (計測): Dimension measurement, leveling, progress photography, LiDAR measurement, punch list verification
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, hasBlueprint } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const blueprintNote = hasBlueprint
      ? " Blueprint uploaded — treat as a complex multi-trade construction project requiring multiple robot types and higher quantities."
      : "";

    const userPrompt = `Job description: ${description}${blueprintNote}

${ROBOT_CATALOG}

Analyze the job description and determine:
1. What construction tasks are needed
2. Which robot types are required
3. How many of each robot type are needed based on the scale and complexity of the job

Return JSON via the tool call with this structure:
{
  "detectedTasks": ["task1", "task2"],
  "matchedRobots": [
    { "id": "robot_id", "matchScore": 95, "matchReason": "Short explanation", "quantity": 2 }
  ]
}

Rules:
- detectedTasks should be 3-8 high-level task categories detected from the 15 construction categories
- matchedRobots should include ALL robot types that are relevant, sorted by matchScore descending
- matchScore should be 50-99
- matchReason should be 1-2 sentences explaining why this robot type is needed and what it will do
- quantity should be 1-10 based on project scale (blueprint = larger scale = more units)
- For blueprint uploads, assume a medium-to-large commercial project and assign higher quantities
- Use exact robot IDs from the catalog`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a construction robot deployment specialist. Analyze the job description and determine which humanoid robot types are needed and how many of each. Consider the scale of the project, the variety of tasks, and the physical labor requirements. Return only valid JSON via tool call.",
          },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "match_robots",
              description: "Return detected tasks, matched robot types, and required quantities for a construction job",
              parameters: {
                type: "object",
                properties: {
                  detectedTasks: {
                    type: "array",
                    items: { type: "string" },
                  },
                  matchedRobots: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        matchScore: { type: "number" },
                        matchReason: { type: "string" },
                        quantity: { type: "number" },
                      },
                      required: ["id", "matchScore", "matchReason", "quantity"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["detectedTasks", "matchedRobots"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "match_robots" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try parsing content directly
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Could not parse AI response");
  } catch (e) {
    console.error("match-robots error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
