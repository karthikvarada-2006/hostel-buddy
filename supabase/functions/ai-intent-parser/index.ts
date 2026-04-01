import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * AI Intent Parser Edge Function
 * This function uses Gemini API to convert raw voice text into structured JSON commands.
 */
serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { text } = await req.json();

        if (!text) {
            return new Response(JSON.stringify({ error: "No text provided" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

        // FALLBACK logic if AI is not available or for demo
        if (!GEMINI_API_KEY) {
            console.warn("GEMINI_API_KEY not set. Using fallback pattern matching.");
            return handleFallback(text);
        }

        // Call Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Act as an intelligent command intent parser for a Hostel Management System.
            Convert the following user speech into a structured JSON for the frontend to handle.
            
            Supported Intents: 
            - navigate (params: page) -> [dashboard, complaints, passes, attendance, menu, students, profile, notices]
            - add_student (params: name)
            - delete_student (params: name)
            - view_complaints (params: status [pending, resolved, all])
            - add_complaint
            - mark_attendance
            - submit_attendance
            - add_notice (params: title)
            - delete_notice (params: position e.g. "first", "last")
            - logout
            - go_back
            - refresh
            - help
            
            Guidelines:
            - If they ask for "meal", "food", "breakfast", etc., page is "menu".
            - If they ask for "problems", "issues", "reports", it's "complaints".
            - If they ask for "vacation", "outing", "exit", it's "passes".
            - BE CONSERVATIVE: If you are not 80% sure, return { "intent": "unknown" }.
            - AVOID FALSE POSITIVES: "I'm looking at the list" -> unknown (too ambiguous).
            
            Strict Examples (What NOT to do):
            - "The students are noisy" -> { "intent": "unknown" }
            - "I like this dashboard" -> { "intent": "unknown" }
            - "Where is the attendance?" -> { "intent": "navigate", "parameters": { "page": "attendance" } }
            
            Example mappings:
            "show me all students" -> { "intent": "navigate", "parameters": { "page": "students" } }
            "i want to see the menu" -> { "intent": "navigate", "parameters": { "page": "menu" } }
            "how do I use this?" -> { "intent": "help", "parameters": {} }
            "get rid of the last notice" -> { "intent": "delete_notice", "parameters": { "position": "last" } }
            
            Format: { "intent": "intent_name", "entity": "entity_name", "parameters": {} }
            
            Speech: "${text}"
            Return ONLY the raw JSON object.`
                    }]
                }]
            })
        });

        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

        // Extract JSON using regex (more robust than simple replace)
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        const cleanJson = jsonMatch ? jsonMatch[0] : "{}";
        const result = JSON.parse(cleanJson);

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

function handleFallback(text: string) {
    const cmd = text.toLowerCase();
    let result = { intent: "unknown", entity: "none", parameters: {} };

    if (cmd.includes("dashboard")) result = { intent: "navigate", entity: "page", parameters: { page: "dashboard" } };
    else if (cmd.includes("complaint")) result = { intent: "navigate", entity: "page", parameters: { page: "complaints" } };
    else if (cmd.includes("delete user") || cmd.includes("remove user") || cmd.includes("delete student")) {
        const name = cmd.replace(/delete user|remove user|delete student/g, "").trim();
        result = { intent: "delete_student", entity: "student", parameters: { name } };
    }
    else if (cmd.includes("add student") || cmd.includes("add new student")) {
        const name = cmd.replace(/add student|add new student/g, "").trim();
        result = { intent: "add_student", entity: "student", parameters: { name } };
    }

    return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}
