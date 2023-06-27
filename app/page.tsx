'use client';

import { useChat } from '@/hooks/use-chat';
import MessageCard from './MessageCard';
import { Pause, Send, RotateCw, MoreHorizontal } from 'react-feather';
import classNames from 'classnames';
import { useRef } from 'react';
import useScrollBottom from '@/hooks/use-scroll-bottom';

const Chat = () => {
  const {
    messages,
    input,
    handleSubmit,
    handleInputChange,
    isLoading,
    stop,
    reload,
  } = useChat({});
  console.log('messages:', messages);

  const disabledClassName = isLoading
    ? 'cursor-not-allowed pointer-events-none opacity-70'
    : '';

  const getBtnContent = () => {
    if (isLoading) {
      return (
        <>
          <Pause className="mr-2" size={16} />
          暂停生成
        </>
      );
    }
    return (
      <>
        <RotateCw className="mr-2" size={16} />
        重新生成
      </>
    );
  };

  const scrollRef = useRef<HTMLUListElement | null>(null);
  useScrollBottom({ scrollRef });

  return (
    <div className="flex h-full flex-col w-full max-w-xl pb-36 pt-9 mx-auto stretch">
      <ul className="space-y-4" ref={scrollRef}>
        {messages.map((message) => (
          <MessageCard key={message.id} message={message} />
        ))}
      </ul>

      <div className="fixed w-full left-0 bottom-0 py-4 bg-gray-100 border-t border-t-gray-300">
        {messages.length > 0 ? (
          <button
            className="mb-2 mx-auto border border-gray-300 bg-gray-100 text-gray-600 p-2 px-8 rounded-md hover:bg-gray-200 transition-all flex items-center"
            onClick={isLoading ? stop : reload}
          >
            {getBtnContent()}
          </button>
        ) : null}
        <form
          onSubmit={handleSubmit}
          className="max-w-xl w-full mx-auto relative"
        >
          <input
            disabled={isLoading}
            value={input}
            onChange={handleInputChange}
            className={classNames(
              'w-full p-3 focus-visible:outline-gray-300 border border-gray-300 bg-gray-100 rounded-md shadow-xl focus:shadow-2xl transition-all',
              disabledClassName
            )}
            placeholder="随便说点什么..."
          />
          {isLoading ? (
            <button
              className={classNames(
                'absolute right-3 bg-gray-200 p-1 top-1/2 -translate-y-1/2 rounded max-w-xs transition-all',
                disabledClassName
              )}
            >
              <MoreHorizontal size={16} />
            </button>
          ) : (
            <button className="absolute right-3 bg-gray-200 hover:text-white p-1 top-1/2 -translate-y-1/2 rounded max-w-xs hover:bg-green-400 transition-all">
              <Send size={16} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default Chat;
