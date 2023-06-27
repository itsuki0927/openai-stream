import { AIStream } from './ai-stream';

export function trimStartOfStreamHelper() {
  let start = true;
  return (text: string) => {
    if (start) text = text.trimStart();
    if (text) start = false;
    return text;
  };
}

function parseOpenAIStream(): (data: string) => string | void {
  const trimStartOfStream = trimStartOfStreamHelper();

  return (data) => {
    const json = JSON.parse(data); // 将 json 字符串解析成对象

    const text = trimStartOfStream(
      json.choices[0]?.delta?.content ?? json.choices[0]?.text ?? ''
    ); // 读取对应的字段

    return text;
  };
}

export function OpenAIStream(res: Response): ReadableStream {
  return AIStream(res, parseOpenAIStream());
}
