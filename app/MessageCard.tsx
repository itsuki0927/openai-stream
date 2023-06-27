import { markdownToHTML } from '@/libs/marked';
import { Message } from '@/types';
import classNames from 'classnames';

interface MessageCardProps {
  message: Message;
}

type AvatarProps = Pick<Message, 'role'>;

const Avatar = ({ role }: AvatarProps) => {
  const getName = () => (role === 'user' ? 'U' : 'AI');

  return (
    <span
      className={classNames(
        'w-6 h-6 inline-flex items-center justify-center rounded-full min-w-[24px]',
        role === 'user' ? 'bg-orange-300' : 'bg-green-400'
      )}
    >
      {getName()}
    </span>
  );
};

const MessageCard = ({ message }: MessageCardProps) => {
  const content = markdownToHTML(message.content);

  return (
    <div className="flex items-start">
      <Avatar role={message.role} />
      <div
        className="pl-2 leading-6 prose transition-all max-w-xl"
        dangerouslySetInnerHTML={{ __html: content }}
      ></div>
    </div>
  );
};

export default MessageCard;
