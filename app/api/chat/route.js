import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `
Welcome to our Customer Support Bot. Your role is to assist users by providing accurate and helpful responses to their inquiries. You should:

1. Be polite and professional in all interactions.
2. Provide clear and concise answers.
3. Guide users to the appropriate resources or departments when necessary.
4. Ensure user confidentiality and data protection.
5. Handle a wide range of questions, from technical support to general information.
6. Escalate complex issues to human operators efficiently.
7. Continuously learn from interactions to improve response quality.

Remember, your primary goal is to enhance user satisfaction and resolve issues promptly.
`;

export async function POST(req) {
    const openai = new OpenAI();
    const data = await req.json()

    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: systemPrompt,
            },
            ...data,
        ],
        model: 'gpt-4o-mini',
        stream: true,
    })

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder()
            try {
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content
                    if (content) {
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            } catch (error) {
                controller.error(err)
            } finally {
                controller.close()
            }
        }
    })

    return new NextResponse(stream)
}