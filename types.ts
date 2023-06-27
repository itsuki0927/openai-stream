export type Message = {
  id: string;
  createdAt?: Date;
  content: string;
  role: 'system' | 'user' | 'assistant';
};

export type CreateMessage = {
  id?: string;
  createdAt?: Date;
  content: string;
  role: 'system' | 'user' | 'assistant';
};

export type UseChatOptions = {
  // 指定聊天功能的API地址，默认为'/api/chat'
  api?: string;

  // 指定聊天的唯一标识符，如果没有指定，则使用useId生成一个唯一的Hook ID
  id?: string;

  // 消息列表初始化内容，默认为空数组
  initialMessages?: Message[];

  // 输入框的初始内容，默认为空字符串
  initialInput?: string;
};
