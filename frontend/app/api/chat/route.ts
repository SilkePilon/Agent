import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { evaluate } from 'mathjs';
import { promises as fs } from 'fs';
import { join } from 'path';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, mode = 'agent', provider = 'openrouter', selectedModel = 'google/gemini-2.5-flash-preview-05-20:thinking' } = await req.json();
  const openrouter = createOpenRouter({
    apiKey: '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',
  });

  // Select the appropriate model based on provider and selected model
  let modelToUse;
  if (provider === 'google') {
    modelToUse = google('gemini-2.5-flash-preview-05-20');
  } else {
    // OpenRouter provider
    modelToUse = openrouter(selectedModel);
  }  // Base configuration
  const baseConfig = {
    model: modelToUse,
    messages,
  };
  
  // Create headers to send model information back to the client
  const headers = new Headers();
  headers.set('X-AI-Model-ID', selectedModel);
  headers.set('X-AI-Provider', provider);

  // Agent mode with tools and multi-step reasoning
  if (mode === 'agent') {
    const result = streamText({
      ...baseConfig,
      maxSteps: 10, // Enable multi-step agent behavior
      tools: {
      // Mathematical calculations
      calculate: tool({
        description: 'Perform mathematical calculations and evaluations. Supports complex expressions, unit conversions, and mathematical functions.',
        parameters: z.object({
          expression: z.string().describe('Mathematical expression to evaluate (e.g., "2 + 2", "sin(45 deg)", "12 cm to inch")')
        }),
        execute: async ({ expression }) => {
          try {
            const result = evaluate(expression);
            return {
              expression,
              result: result.toString(),
              success: true
            };
          } catch (error) {
            return {
              expression,
              error: error instanceof Error ? error.message : 'Calculation failed',
              success: false
            };
          }
        },
      }),

      // Web search simulation (in a real app, you'd use a real search API)
      webSearch: tool({
        description: 'Search the web for current information, news, or research topics.',
        parameters: z.object({
          query: z.string().describe('Search query'),
          type: z.enum(['general', 'news', 'academic', 'images']).optional().describe('Type of search')
        }),
        execute: async ({ query, type = 'general' }) => {
          // Simulate web search results
          const mockResults = [
            {
              title: `Search results for: ${query}`,
              snippet: `This is a simulated search result for "${query}". In a real implementation, this would connect to a search API.`,
              url: `https://example.com/search?q=${encodeURIComponent(query)}`,
              type: type
            }
          ];
          return {
            query,
            type,
            results: mockResults,
            resultCount: mockResults.length
          };
        },
      }),

      // File operations
      createFile: tool({
        description: 'Create a new file with specified content. Useful for generating code, documents, or saving data.',
        parameters: z.object({
          filename: z.string().describe('Name of the file to create'),
          content: z.string().describe('Content to write to the file'),
          directory: z.string().optional().describe('Directory path (optional, defaults to current)')
        }),        execute: async ({ filename, content }) => {
          try {
            // In a real app, you'd want proper file system security
            const filePath = join(process.cwd(), 'generated', filename);
            
            // Ensure directory exists
            await fs.mkdir(join(process.cwd(), 'generated'), { recursive: true });
            
            await fs.writeFile(filePath, content, 'utf-8');
            
            return {
              filename,
              filePath,
              size: content.length,
              success: true,
              message: `File "${filename}" created successfully`
            };
          } catch (error) {
            return {
              filename,
              error: error instanceof Error ? error.message : 'File creation failed',
              success: false
            };
          }
        },
      }),

      // Code generation and analysis
      generateCode: tool({
        description: 'Generate code in various programming languages based on specifications.',
        parameters: z.object({
          language: z.string().describe('Programming language (e.g., typescript, python, javascript)'),
          description: z.string().describe('Description of what the code should do'),
          framework: z.string().optional().describe('Framework or library to use (optional)')
        }),
        execute: async ({ language, description, framework }) => {
          // This would typically use a specialized code generation model
          const codeTemplate = `// Generated ${language} code for: ${description}
${framework ? `// Using framework: ${framework}` : ''}

// TODO: Implement the functionality described as: ${description}
function generatedFunction() {
  // Implementation goes here
  console.log("This is generated ${language} code");
}`;

          return {
            language,
            description,
            framework,
            code: codeTemplate,
            filename: `generated_${Date.now()}.${language === 'typescript' ? 'ts' : language === 'python' ? 'py' : 'js'}`,
            success: true
          };
        },
      }),

      // Task planning and management
      createTaskPlan: tool({
        description: 'Break down complex tasks into manageable steps and create an execution plan.',
        parameters: z.object({
          task: z.string().describe('The main task or goal to accomplish'),
          complexity: z.enum(['simple', 'medium', 'complex']).optional().describe('Task complexity level')
        }),
        execute: async ({ task, complexity = 'medium' }) => {
          const steps = complexity === 'simple' 
            ? [`Step 1: Analyze the task: ${task}`, `Step 2: Execute the main action`, `Step 3: Verify completion`]
            : complexity === 'medium'
            ? [`Step 1: Research and gather requirements for: ${task}`, `Step 2: Plan the approach`, `Step 3: Break down into subtasks`, `Step 4: Execute each subtask`, `Step 5: Test and validate`, `Step 6: Complete and document`]
            : [`Step 1: Comprehensive analysis of: ${task}`, `Step 2: Stakeholder identification`, `Step 3: Resource assessment`, `Step 4: Risk analysis`, `Step 5: Detailed planning`, `Step 6: Phase 1 execution`, `Step 7: Review and adjust`, `Step 8: Phase 2 execution`, `Step 9: Quality assurance`, `Step 10: Final delivery`];

          return {
            task,
            complexity,
            steps,
            estimatedTime: complexity === 'simple' ? '1-2 hours' : complexity === 'medium' ? '1-2 days' : '1-2 weeks',
            priority: 'medium',
            id: `task_${Date.now()}`
          };
        },
      }),

      // Data analysis
      analyzeData: tool({
        description: 'Analyze structured data and provide insights, statistics, or summaries.',
        parameters: z.object({
          data: z.string().describe('Data to analyze (JSON, CSV format, or description)'),
          analysisType: z.enum(['statistical', 'trends', 'summary', 'patterns']).describe('Type of analysis to perform')
        }),
        execute: async ({ data, analysisType }) => {
          // Simulate data analysis
          const insights = {
            statistical: 'Statistical analysis shows normal distribution with mean value trending upward.',
            trends: 'Data trends indicate steady growth over the analyzed period with seasonal patterns.',
            summary: 'Summary: The dataset contains structured information with key metrics showing positive indicators.',
            patterns: 'Pattern analysis reveals recurring cycles and correlations between key variables.'
          };

          return {
            dataSize: data.length,
            analysisType,
            insights: insights[analysisType],
            recommendations: `Based on ${analysisType} analysis, consider implementing data-driven optimizations.`,
            success: true
          };
        },
      }),

      // Weather information (enhanced)
      weather: tool({
        description: 'Get comprehensive weather information for any location including current conditions and forecast.',
        parameters: z.object({
          location: z.string().describe('The location to get weather for'),
          includesForecast: z.boolean().optional().describe('Include 5-day forecast')
        }),
        execute: async ({ location, includesForecast = false }) => {
          const temperature = Math.round(Math.random() * (90 - 32) + 32);
          const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)];
          
          const result: { location: string; current: { temperature: number; condition: string; humidity: number; windSpeed: number }; forecast?: Array<{ day: number; temperature: number; condition: string }> } = {
            location,
            current: {
              temperature,
              condition: conditions,
              humidity: Math.round(Math.random() * 50 + 30),
              windSpeed: Math.round(Math.random() * 15 + 5)
            }
          };

          if (includesForecast) {
            result.forecast = Array.from({ length: 5 }, (_, i) => ({
              day: i + 1,
              temperature: Math.round(Math.random() * (85 - 35) + 35),
              condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)]
            }));
          }          // We can't add headers to this direct result object
          return result;
        },
      }),      // Email composition helper
      composeEmail: tool({
        description: 'Help compose professional emails for various purposes.',
        parameters: z.object({
          purpose: z.enum(['business', 'follow-up', 'request', 'thank-you', 'proposal']).describe('Purpose of the email'),
          recipient: z.string().describe('Recipient information or context'),
          keyPoints: z.array(z.string()).describe('Key points to include in the email')
        }),
        execute: async ({ purpose, recipient, keyPoints }) => {
          const templates = {
            business: `Subject: Business Inquiry

Dear ${recipient},

I hope this email finds you well. I am writing to discuss...`,
            'follow-up': `Subject: Following Up on Our Previous Conversation

Dear ${recipient},

Thank you for your time during our recent discussion. I wanted to follow up on...`,
            request: `Subject: Request for Assistance

Dear ${recipient},

I hope you are doing well. I am reaching out to request...`,
            'thank-you': `Subject: Thank You

Dear ${recipient},

I wanted to take a moment to express my sincere gratitude for...`,
            proposal: `Subject: Proposal for Your Consideration

Dear ${recipient},

I am pleased to present this proposal for your review...`
          };

          return {
            purpose,
            recipient,
            subject: `Generated ${purpose} email`,
            template: templates[purpose],
            keyPoints,            suggestions: ['Keep it concise', 'Use professional tone', 'Include clear call-to-action']
          };
        },
      })
    },
    system: `You are an advanced AI Agent capable of performing a wide variety of tasks. You have access to multiple tools that allow you to:

- Perform mathematical calculations and data analysis
- Search for information and research topics
- Generate and analyze code in multiple programming languages
- Create and manage files
- Plan and break down complex tasks
- Compose professional communications
- Provide weather and environmental information

When a user gives you a task:
1. First, understand what they're trying to accomplish
2. Break down complex tasks into manageable steps
3. Use the appropriate tools to gather information or perform actions
4. Provide clear, helpful responses with actionable insights
5. If a task requires multiple steps, explain your process

Always be proactive in suggesting how you can help accomplish the user's goals. If you need clarification, ask specific questions to better understand their needs.`,
    });

    const response = result.toDataStreamResponse();
    // Add model information to the response headers
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });
    return response;  }  // Normal chat mode - simple conversation with no tools
  const result = streamText({
    ...baseConfig,
    tools: {},
    system: `You are a helpful AI assistant in Chat Mode. You can engage in natural conversation, answer questions, and provide helpful information on a wide variety of topics.

Be conversational, friendly, and helpful. Provide thoughtful responses to user questions and engage in meaningful dialogue.`,
  });

  const response = result.toDataStreamResponse();
  // Add model information to the response headers
  headers.forEach((value, key) => {
    response.headers.set(key, value);
  });
  return response;
}