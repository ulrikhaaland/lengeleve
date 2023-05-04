import React, { useState } from 'react';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { IconButton } from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

interface ChatHistory {
  id: number;
  content: string;
}

interface ChatHistoryProps {
  chatHistories: ChatHistory[];
  username: string;
  onNewChat: () => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  chatHistories,
  username,
  onNewChat,
}) => {
  const [selectedChatHistory, setSelectedChatHistory] = useState<
    number | undefined
  >();

  const handleChatHistoryClick = (id: number) => {
    setSelectedChatHistory(id);
  };

  const handleDeleteClick = (id: number) => {};

  return (
    <div className='h-full pb-28 w-3/12 text-white md:h-full md:w-full px-4'>
      <h2 className='text-2xl font-bold text-center pb-2'>History</h2>
      <div className='rounded-2xl border-4 border-gray-600 h-full flex flex-col w-full'>
        <div className='header-footer flex items-center justify-between p-4 border-b border-bg2'>
          <button
            className='bg-indigo-500 w-full text-white rounded px-4 py-2 flex items-center hover:bg-indigo-600 hover:text-white transition-colors duration-200'
            onClick={onNewChat}
          >
            <span className='mr-2 text-xl'>+</span>
            New Chat
          </button>
        </div>
        <div className='overflow-y-auto flex-grow px-2'>
          <ul>
            {chatHistories.map((chatHistory) => {
              const isSelected = selectedChatHistory === chatHistory.id;

              return (
                <li
                  key={chatHistory.id}
                  onClick={() => handleChatHistoryClick(chatHistory.id)}
                  className={`px-4 py-2 h-10 flex items-center justify-between hover:bg-gray-800 hover:rounded cursor-pointer ${
                    isSelected ? 'bg-gray-800 rounded' : ''
                  }`}
                >
                  <div className='flex-grow'>{chatHistory.content}</div>
                  {(isSelected || !selectedChatHistory) && isSelected && (
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(chatHistory.id);
                      }}
                    >
                      <DeleteForeverIcon className='text-white' />
                    </IconButton>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <div className='header-footer flex items-center p-4 border-t-2 border-bg2 color-bg2'>
          <IconButton className='color-white text-white'>
            <AccountCircleIcon className='h-8 w-8 pr-2' />
          </IconButton>
          <span>{username}</span>
        </div>
      </div>
    </div>
  );
};

export default ChatHistory;
