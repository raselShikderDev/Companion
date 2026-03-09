import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const explainMatches = async (user: any, candidates: any[]) => {

  const prompt = `
You are a travel companion recommendation AI.

User profile:
Interests: ${user.interests}
Travel style: ${user.travelStyleTags}

Recommended explorers:
${JSON.stringify(candidates)}

Explain briefly why these explorers are good matches.
Return short explanations.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an AI that explains travel companion compatibility.",
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
  explainMatches,
};