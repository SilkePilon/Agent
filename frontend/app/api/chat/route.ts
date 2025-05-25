import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { evaluate } from 'mathjs';
import { promises as fs } from 'fs';
import { join } from 'path';

const GITHUB_API_KEY = process.env.GITHUB_API_KEY;
const GITLAB_API_KEY = process.env.GITLAB_API_KEY;

// Helper function to check GitHub authentication status
function checkGitHubAuth() {
  if (GITHUB_API_KEY) {
    console.log("GitHub API key is configured.");
    return { authenticated: true, service: 'GitHub', apiKey: GITHUB_API_KEY };
  } else {
    console.log("GitHub API key is missing.");
    return { authenticated: false, service: 'GitHub', message: 'GitHub API key not configured on the server.' };
  }
}

// Helper function to check GitLab authentication status
function checkGitLabAuth() {
  if (GITLAB_API_KEY) {
    console.log("GitLab API key is configured.");
    return { authenticated: true, service: 'GitLab', apiKey: GITLAB_API_KEY };
  } else {
    console.log("GitLab API key is missing.");
    return { authenticated: false, service: 'GitLab', message: 'GitLab API key not configured on the server.' };
  }
}

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, mode = 'agent', provider = 'openrouter', selectedModel = 'google/gemini-2.5-flash-preview-05-20:thinking', enableWebBrowsing = false } = await req.json();
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
  }

  // Base configuration
  const baseConfig = {
    model: modelToUse,
    messages,
  };

  // Agent mode with tools and multi-step reasoning
  if (mode === 'agent') {
    const agentTools: Record<string, any> = {
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
      // File operations
      createFile: tool({
        description: 'Create a new file with specified content. Useful for generating code, documents, or saving data.',
        parameters: z.object({
          filename: z.string().describe('Name of the file to create'),
          content: z.string().describe('Content to write to the file'),
          directory: z.string().optional().describe('Directory path (optional, defaults to current)')
        }),
        execute: async ({ filename, content }) => {
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
          }

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
            keyPoints,
            suggestions: ['Keep it concise', 'Use professional tone', 'Include clear call-to-action']
          };
        },
      }),

      // Mode switching suggestion (for auto-continuation from chat mode)
      suggestModeSwitch: tool({
        description: 'Suggest switching to Agent Mode when a task requires tools and capabilities not available in Chat Mode.',
        parameters: z.object({
          reason: z.string().describe('Explanation of why Agent Mode would be better for this task'),
          capabilities: z.array(z.string()).describe('List of specific Agent Mode capabilities that would help'),
          userRequest: z.string().describe('The original user request that triggered this suggestion')
        }),
        execute: async ({ reason, capabilities, userRequest }) => {
          return {
            suggestion: 'switch_to_agent_mode',
            reason,
            capabilities,
            userRequest,
            message: `This request would be much better handled in Agent Mode. Would you like me to switch to Agent Mode and help you with this task using advanced tools and capabilities?`,
            autoSwitchRecommended: true
          };
        },
      }),
      getCodeReview: tool({
        description: "Fetches the code changes (diff) from a GitHub pull request URL for the AI to review. GitLab is not yet supported.",
        parameters: z.object({
          url: z.string().describe('The URL of the pull request or merge request'),
          repository: z.string().optional().describe('Optional: Name of the repository if not inferable from URL')
        }),
        execute: async ({ url, repository }) => {
          const githubPrPattern = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)\/?$/;
          const githubMatch = url.match(githubPrPattern);

          if (githubMatch) {
            const owner = githubMatch[1];
            const repo = githubMatch[2];
            const pull_number = githubMatch[3];

            const authStatus = checkGitHubAuth();
            if (!authStatus.authenticated || !authStatus.apiKey) {
              return { error: true, message: authStatus.message || 'GitHub API key not configured or missing.', service: 'GitHub' };
            }

            const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}`;
            const headers = {
              'Accept': 'application/vnd.github.v3.diff',
              'Authorization': `Bearer ${authStatus.apiKey}`,
              'X-GitHub-Api-Version': '2022-11-28'
            };

            try {
              const response = await fetch(apiUrl, { headers });
              if (!response.ok) {
                let errorDetail = response.statusText;
                try {
                  const errorJson = await response.json();
                  errorDetail = errorJson.message || errorDetail;
                } catch (e) {
                  // Ignore if response is not JSON
                }
                return { error: true, message: `Failed to fetch PR diff from GitHub: ${errorDetail}`, details: await response.text(), service: 'GitHub' };
              }

              const diffContent = await response.text();
              const maxDiffLength = 5000; // Characters
              let diffSnippet = diffContent;
              if (diffContent.length > maxDiffLength) {
                diffSnippet = diffContent.substring(0, maxDiffLength) + '\n... [diff truncated] ...';
              }

              return {
                status: 'success',
                message: `Successfully fetched diff for GitHub PR: ${url}. Diff content below is ready for AI review.`,
                service: 'GitHub',
                owner,
                repo,
                pull_number,
                diff: diffSnippet,
                fullDiffLength: diffContent.length
              };

            } catch (error) {
              return { error: true, message: `Error fetching GitHub PR diff: ${error instanceof Error ? error.message : String(error)}`, service: 'GitHub' };
            }

          } else if (url.includes('gitlab.com')) {
            // Check GitLab auth even if functionality is pending, for consistency
            const authStatus = checkGitLabAuth();
            return { 
              status: 'pending', 
              message: 'GitLab code review is not yet implemented. Only GitHub is supported in this version.', 
              service: 'GitLab',
              authentication: authStatus // Include auth status for GitLab as well
            };
          } else {
            return { error: true, message: 'Unsupported URL. Please provide a GitHub PR URL (e.g., https://github.com/owner/repo/pull/number).' };
          }
        }
      }),
      answerRepoQuestion: tool({
        description: "Answers questions about a GitHub repository by fetching specific file contents or listing directory contents. Requires the repository to be specified as 'owner/repo'. Example questions: 'Show me the file src/app.ts in user/repo' or 'What is in the public directory of user/another-repo?' GitLab is not yet supported.",
        parameters: z.object({
          question: z.string().describe('The user\'s question about the repository, e.g., "Show me file src/app.js" or "List contents of public"'),
          repository: z.string().describe('The repository in "owner/repo" format (e.g., "myorg/myproject")')
        }),
        execute: async ({ question, repository }) => {
          const authStatus = checkGitHubAuth();
          if (!authStatus.authenticated || !authStatus.apiKey) {
            return { error: true, message: authStatus.message || 'GitHub API key not configured or missing.', service: 'GitHub' };
          }

          if (!repository || !repository.includes('/')) {
            return { error: true, message: 'Please specify the repository in "owner/repo" format using the repository parameter.' };
          }
          const [owner, repo] = repository.split('/');
          if (!owner || !repo) {
            return { error: true, message: 'Invalid repository format. Please use "owner/repo".' };
          }

          const fileRegex = /file\s+([\w\/\.-]+)/i;
          const dirRegex = /(?:directory|folder|contents of|list(?: files in)?)\s+([\w\/\.-]+)/i;

          const fileMatch = question.match(fileRegex);
          const dirMatch = question.match(dirRegex);

          const headers = {
            'Authorization': `Bearer ${authStatus.apiKey}`,
            'Accept': 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28'
          };
          const maxContentLength = 5000; // Characters

          if (fileMatch) {
            const filePath = fileMatch[1];
            const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
            try {
              const response = await fetch(apiUrl, { headers });
              if (!response.ok) {
                if (response.status === 404) {
                  return { error: true, message: `File not found: ${filePath} in ${repository}. Details: ${await response.text()}` };
                }
                return { error: true, message: `Error fetching file from GitHub: ${response.statusText}. Details: ${await response.text()}` };
              }
              const data = await response.json();
              if (data.type !== 'file') {
                return { error: true, message: `Path '${filePath}' in ${repository} is not a file (it's a ${data.type}).` };
              }
              if (!data.content) {
                return { error: true, message: `Could not retrieve content for file '${filePath}' in ${repository}. It might be an empty file or an issue with the response.`};
              }
              const decodedContent = Buffer.from(data.content, 'base64').toString('utf-8');
              let contentSnippet = decodedContent;
              if (decodedContent.length > maxContentLength) {
                contentSnippet = decodedContent.substring(0, maxContentLength) + '\n... [content truncated] ...';
              }
              return { status: 'success', type: 'file', path: filePath, content: contentSnippet, message: `Content of file '${filePath}' from ${repository}:` };
            } catch (error) {
              return { error: true, message: `Error processing file request for ${filePath} in ${repository}: ${error instanceof Error ? error.message : String(error)}` };
            }
          } else if (dirMatch) {
            const dirPath = dirMatch[1] === '/' || dirMatch[1] === '.' ? '' : dirMatch[1]; // Handle root path
            const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}`;
            try {
              const response = await fetch(apiUrl, { headers });
              if (!response.ok) {
                 if (response.status === 404) {
                  return { error: true, message: `Directory not found: ${dirPath || '/'} in ${repository}. Details: ${await response.text()}` };
                }
                return { error: true, message: `Error fetching directory contents from GitHub: ${response.statusText}. Details: ${await response.text()}` };
              }
              const data = await response.json();
              if (!Array.isArray(data)) {
                // If it's a single object and type is file, the user might have asked to list a file.
                if (data && data.type === 'file') {
                   return { error: true, message: `Path '${dirPath}' in ${repository} is a file, not a directory. To see its content, ask to 'show me file ${dirPath}'.` };
                }
                return { error: true, message: `Path '${dirPath || '/'}' in ${repository} is not a directory. Details: ${JSON.stringify(data)}` };
              }
              const items = data.map(item => ({ name: item.name, type: item.type, path: item.path, size: item.size }));
              return { status: 'success', type: 'directory', path: dirPath || '/', items: items, message: `Contents of directory '${dirPath || '/'}' in ${repository}:` };
            } catch (error) {
              return { error: true, message: `Error processing directory listing request for ${dirPath || '/'} in ${repository}: ${error instanceof Error ? error.message : String(error)}` };
            }
          } else {
            return {
              status: 'clarification_needed',
              message: `I can fetch specific file contents or list directory contents from the repository '${repository}'. Please ask, for example, 'Show me the file src/index.js' or 'List contents of the src directory'.`
            };
          }
        }
      })
    };

    if (enableWebBrowsing) {
      agentTools.webSearch = tool({
        description: 'Search the web for real-time information, news, or research topics using a real search API. Useful for up-to-date information.',
        parameters: z.object({
          query: z.string().describe('Search query'),
          type: z.enum(['general', 'news', 'academic', 'images']).optional().describe('Type of search (e.g., news, academic)')
        }),
        execute: async ({ query, type = 'general' }) => {
          // TODO: Replace with actual API call to a search engine
          // const apiKey = process.env.SEARCH_API_KEY;
          // const response = await fetch(`https://api.example-search.com/search?q=${encodeURIComponent(query)}&type=${type}&key=${apiKey}`);
          // const data = await response.json();
          // return { query, type, results: data.results, resultCount: data.results.length };

          // Enhanced mock results
          const mockResults = [
            {
              title: `Enhanced Search: ${query} (${type})`,
              snippet: `This is an enhanced mock search result for "${query}". A real API would provide live data.`,
              url: `https://example.com/search?q=${encodeURIComponent(query)}&type=${type}`,
              source: "WebSearchAPI (Mock)"
            },
            {
              title: `More results for: ${query}`,
              snippet: `Another detailed snippet about "${query}".`,
              url: `https://example.com/search?q=${encodeURIComponent(query)}&type=${type}&page=2`,
              source: "WebSearchAPI (Mock)"
            }
          ];
          return {
            query,
            type,
            results: mockResults,
            resultCount: mockResults.length,
            message: "Successfully fetched enhanced web search results (mock)."
          };
        },
      });
    }

    const result = streamText({
      ...baseConfig,
      maxSteps: 10, // Enable multi-step agent behavior
      tools: agentTools,
      system: `You are an advanced AI Agent capable of performing a wide variety of tasks. You have access to multiple tools that allow you to:

- Perform mathematical calculations and data analysis
${enableWebBrowsing ? "- Search the web for current information, news, or research using the 'webSearch' tool." : "- (Web search is currently disabled)"}
- Create and manage files
- Plan and break down complex tasks
- Compose professional communications
- Provide weather and environmental information
- Fetch code changes from GitHub pull requests for AI-driven code review (GitLab upcoming).
- Answer questions about GitHub repositories by fetching file contents or listing directories (e.g., 'Show me file X in repo Y', 'List directory Z in repo A/B'). GitLab upcoming.

When a user gives you a task:
1. First, understand what they're trying to accomplish.
2. Break down complex tasks into manageable steps.
3. Use the appropriate tools to gather information or perform actions. ${enableWebBrowsing ? "If you need up-to-date information, use the 'webSearch' tool." : ""}
4. Provide clear, helpful responses with actionable insights.
5. If a task requires multiple steps, explain your process.

Always be proactive in suggesting how you can help accomplish the user's goals. If you need clarification, ask specific questions to better understand their needs.`,
    });

    return result.toDataStreamResponse();
  }
  
  // Normal chat mode - simple conversation with limited tools
  const result = streamText({
    ...baseConfig,
    tools: {
      // Mode switching suggestion (only tool available in chat mode)
      suggestModeSwitch: tool({
        description: 'Suggest switching to Agent Mode when a task requires tools and capabilities not available in Chat Mode.',
        parameters: z.object({
          reason: z.string().describe('Explanation of why Agent Mode would be better for this task'),
          capabilities: z.array(z.string()).describe('List of specific Agent Mode capabilities that would help'),
          userRequest: z.string().describe('The original user request that triggered this suggestion')
        }),
        execute: async ({ reason, capabilities, userRequest }) => {
          return {
            suggestion: 'switch_to_agent_mode',
            reason,
            capabilities,
            userRequest,
            message: `This request would be much better handled in Agent Mode. Would you like me to switch to Agent Mode and help you with this task using advanced tools and capabilities?`,
            autoSwitchRecommended: true
          };
        },
      })
    },
    system: `You are a helpful AI assistant in Chat Mode. You can engage in natural conversation and answer questions, but you only have access to one tool: the ability to suggest switching to Agent Mode.

When a user asks something that would be much better handled with tools and actions, you should use the suggestModeSwitch tool. Specifically, suggest Agent Mode when users ask for:

- Mathematical calculations or data analysis
- File creation or management
- Complex task planning and project management
- Web searches or real-time information (if web browsing is enabled in Agent Mode)
- Weather forecasts
- Email composition or professional writing assistance
- Multi-step problem solving that requires tools

When you detect such requests, immediately use the suggestModeSwitch tool with:
1. A clear reason why their request would benefit from Agent Mode
2. The specific capabilities Agent Mode would provide (mentioning web search if it could be relevant)
3. The original user request

Be conversational and helpful for simple questions, but proactively suggest Agent Mode for complex tasks that require tools.`,
  });

  return result.toDataStreamResponse();
}