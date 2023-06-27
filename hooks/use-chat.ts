import { CreateMessage, Message, UseChatOptions } from '@/types';
import { createChunkDecoder, nanoid } from '@/utils';
import {
  ChangeEvent,
  Dispatch,
  FormEvent,
  SetStateAction,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

export type UseChatHelpers = {
  // 当前消息列表
  messages: Message[];

  // 请求过程中可能出现的错误
  error: undefined | Error;

  // 向聊天中追加一条消息
  append: (
    message: Message | CreateMessage
  ) => Promise<string | null | undefined>;

  stop: () => void;

  reload: () => Promise<string | null | undefined>;

  // 设置聊天消息列表
  setMessages: (messages: Message[]) => void;

  // 输入框内容
  input: string;

  // 设置输入框内容
  setInput: Dispatch<SetStateAction<string>>;

  // 处理输入框内容变化
  handleInputChange: (
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>
  ) => void;

  // 处理表单提交
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;

  // 请求是否正在加载中
  isLoading: boolean;
};

export function useChat({
  api = '/api/chat',
  id,
  initialInput = '',
  initialMessages = [],
}: UseChatOptions = {}): UseChatHelpers {
  const hookId = useId();
  // 生成一个chatId
  const chatId = id || hookId;

  const { data, mutate } = useSWR<Message[]>([api, chatId], null, {
    fallbackData: initialMessages,
  });
  const messages = data!;

  // 用 ref 保存最新的消息列表
  const messagesRef = useRef<Message[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const abortControllerRef = useRef<AbortController | null>(null);

  // 处理input输入
  const [input, setInput] = useState(initialInput);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    []
  );

  const { error, trigger, isMutating } = useSWRMutation<
    string | null,
    any,
    [string, string],
    Message[]
  >(
    [api, chatId],
    async (_, { arg: messagesSnapshot }) => {
      try {
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        // 保存上一次的消息列表，用于时光回溯
        const previousMessages = messagesRef.current;
        // 先更新UI
        mutate(messagesSnapshot, false);

        // 处理参数
        const body = messagesSnapshot.map(({ role, content }) => ({
          role,
          content,
        }));

        const res = await fetch(api, {
          method: 'POST',
          body: JSON.stringify({ messages: body }),
          signal: abortController.signal,
        }).catch((err) => {
          // 如果报错了，回退到上一次的消息列表
          mutate(previousMessages, false);
          throw err;
        });

        if (!res.ok) {
          // 如果接口请求不成功，回退到上一次的消息列表
          mutate(previousMessages, false);
          throw new Error(
            (await res.text()) || 'Faild to fetch the chat response.'
          );
        }

        // body为空，直接报错
        if (!res.body) {
          throw new Error('The response body is empty.');
        }

        let result = '';
        const createdAt = new Date();
        // 创建唯一的消息ID
        const replyId = nanoid();
        // 使用 reader 的方式读取ReadableStream
        const reader = res.body.getReader();
        // 使用 TextDecoder 进行将 Uint8Array 解码成 string
        const decode = createChunkDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          // 将二进制value 解析成字符串，然后进行拼接
          result += decode(value);
          // 及时更新UI
          mutate(
            [
              ...messagesSnapshot,
              {
                id: replyId,
                createdAt,
                content: result,
                role: 'assistant',
              },
            ],
            false
          );

          // 如果请求取消了，则需要暂停读取stream
          if (abortControllerRef.current === null) {
            reader.cancel();
            break;
          }
        }

        abortControllerRef.current = null;
        return result;
      } catch (err) {
        if ((err as any).name === 'AbortError') {
          abortControllerRef.current = null;
          return null;
        }
        throw err;
      }
    },
    {
      revalidate: false, // 不需要重新验证缓存
    }
  );

  const append = useCallback(
    async (message: Message | CreateMessage) => {
      if (!message.id) {
        message.id = nanoid();
      }
      // 将消息添加到消息列表，手动触发接口请求
      return trigger(messagesRef.current.concat(message as Message));
    },
    [trigger]
  );

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      // 如果输入框没有内容，直接返回
      if (!input) {
        return;
      }
      // 将内容添加到消息列表中
      append({
        content: input,
        role: 'user',
        createdAt: new Date(),
      });
      setInput('');
    },
    [append, input]
  );

  // 设置消息列表
  const setMessages = useCallback(
    (messages: Message[]) => {
      mutate(messages, false);
      messagesRef.current = messages;
    },
    [mutate]
  );

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      // 取消请求
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const reload = useCallback(async () => {
    if (messagesRef.current.length === 0) return null;

    const lastMessage = messagesRef.current[messagesRef.current.length - 1];
    // 如果最后一条消息是 chatgpt 生成的
    if (lastMessage.role === 'assistant') {
      // 去掉消息列表的最后一条消息，然后触发接口请求
      return trigger(messagesRef.current.slice(0, -1));
    }
    return trigger(messagesRef.current);
  }, [trigger]);

  return {
    reload,
    messages,
    error,
    append,
    setMessages,
    input,
    setInput,
    handleInputChange,
    stop,
    handleSubmit,
    isLoading: isMutating,
  };
}
