import { NextResponse } from 'next/server';

async function makeRequest(endpoint: string, body: any) {
  // Convert special parameters to URL query parameters
  const queryParams = new URLSearchParams();
  
  if (body.prompt) {
    queryParams.append('prompt', body.prompt);
    delete body.prompt;
  }
  if (body.reset) {
    queryParams.append('reset', 'true');
    delete body.reset;
  }
  if (body.generateMail) {
    queryParams.append('generateMail', 'true');
    delete body.generateMail;
  }
  if (body.chatSession) {
    queryParams.append('chatSession', body.chatSession);
    delete body.chatSession;
  }  // Construct URL with the correct webhook endpoint
  const webhookPath = body.isProduction ? 'webhook' : 'webhook-test';
  const url = `http://localhost:5678/${webhookPath}/chat?${queryParams.toString()}`;
  console.log('Making request to:', url); // Debug log

  const response = await fetch(url, {
    method: 'GET', // Using GET since we're using query parameters
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Pass the entire body including isProduction to makeRequest
    const data = await makeRequest('', body);
    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
