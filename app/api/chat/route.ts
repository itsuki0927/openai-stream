import { OpenAIStream } from '@/libs/openai-stream';
import { StreamingTextResponse } from '@/libs/streaming-text-response';
import { Configuration, OpenAIApi } from 'openai-edge';

const config = new Configuration({
  // 环境变量
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

export const runtime = 'edge';

export async function POST(req: Request) {
  // 获得请求参数
  const { messages } = await req.json();

  const response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    stream: true,
    messages: messages.map((message: any) => ({
      content: message.content,
      role: message.role,
    })),
  });

  // 将response传递给AIStream进行处理
  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}
