import { streamText } from 'ai'
import { google } from '@ai-sdk/google'

export async function POST(req: Request) {
  try {
    const { conversation } = await req.json()

    if (!conversation) {
      return Response.json({ error: 'Conversation is required' }, { status: 400 })
    }

    const result = await streamText({
      model: google('gemini-2.0-flash-exp'),
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that generates concise, descriptive titles for chat conversations. 
          
          Rules:
          - Generate a title that captures the main topic or theme of the conversation
          - Keep it under 50 characters
          - Make it descriptive but concise
          - Use title case
          - Don't include quotes or special characters
          - Focus on the key subject matter discussed
          
          Examples:
          - "Setting Up React Project"
          - "JavaScript Array Methods"
          - "Travel Planning for Europe"
          - "Machine Learning Basics"
          - "Bug Fix: Login Authentication"`
        },
        {
          role: 'user',
          content: `Generate a title for this conversation:\n\n${conversation}`
        }
      ],
      maxTokens: 50,
      temperature: 0.3,
    })

    // Get the generated text
    let title = ''
    for await (const chunk of result.textStream) {
      title += chunk
    }

    // Clean up the title
    title = title.trim().replace(/['"]/g, '').slice(0, 50)
    
    if (!title) {
      title = 'New Chat'
    }

    return Response.json({ title })
  } catch (error) {
    console.error('Error generating title:', error)
    return Response.json({ error: 'Failed to generate title' }, { status: 500 })
  }
}
