/** biome-ignore-all lint/suspicious/noExplicitAny: > */
import OpenAI from "openai";
import { envVars } from "../../configs/envVars";

const openai = new OpenAI({
  apiKey: envVars.openAiKey as string,
});

const generateMatchExplanation = async (
  user: any,
  recommendations: any[]
) => {

  const prompt = `
A user is looking for travel companions.

User profile:
Interests: ${user.interests.join(", ")}
Travel styles: ${user.travelStyleTags.join(", ")}

Recommended explorers:
${recommendations
  .map(
    (r, i) => `
${i + 1}. ${r.explorer.fullName}
Interests: ${r.explorer.interests.join(", ")}
Travel styles: ${r.explorer.travelStyleTags.join(", ")}
Compatibility score: ${r.score}
`
  )
  .join("\n")}

Explain briefly why these explorers are good matches.
Return short explanations for each person.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a travel companion recommendation assistant.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return completion.choices[0].message.content;
};

export const aiService = {
  generateMatchExplanation,
};