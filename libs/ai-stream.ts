import {
  createParser,
  type ParseEvent,
  type EventSourceParser,
} from 'eventsource-parser';

export interface AIStreamParser {
  (data: string): string | void;
}

export function createEventStreamTransformer(customParser: AIStreamParser) {
  const decoder = new TextDecoder();
  let parser: EventSourceParser;

  return new TransformStream<Uint8Array, string>({
    async start(controller) {
      function onParse(event: ParseEvent) {
        console.log('event:', event);
        if (event.type === 'event') {
          const data = event.data; // data就是每个数据
          if (data === '[DONE]') {
            controller.terminate();
            return;
          }
          const message = customParser(data);
          console.log('message:', message);
          if (message) controller.enqueue(message);
        }
      }

      parser = createParser(onParse);
    },

    transform(chunk) {
      parser.feed(decoder.decode(chunk));
    },
  });
}

export function createCallbacksTransformer() {
  const encoder = new TextEncoder();

  return new TransformStream<string, Uint8Array>({
    async transform(message, controller): Promise<void> {
      controller.enqueue(encoder.encode(message));
    },
  });
}

export function AIStream(
  res: Response,
  customParser: AIStreamParser
): ReadableStream {
  if (!res.ok) {
    throw new Error(
      `Failed to convert the response to stream. Received status code: ${res.status}.`
    );
  }

  const stream =
    res.body ||
    new ReadableStream({
      start(controller) {
        controller.close();
      },
    });

  console.log('stream:', stream);
  return stream
    .pipeThrough(createEventStreamTransformer(customParser))
    .pipeThrough(createCallbacksTransformer());
}
