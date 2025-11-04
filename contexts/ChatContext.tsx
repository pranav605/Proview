import React, { createContext, ReactNode, useContext, useState } from 'react';

type Chat = {
  id: string;
  name: string;
};

type ChatContextType = {
  chats: Chat[];
  addChat: (chat: Chat) => void;
  removeChat: (id: string) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([
  ]);

  const addChat = (chat: Chat) => {
    setChats((prev) => [chat, ...prev]);
  };

  const removeChat = (id: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== id));
  };

  return (
    <ChatContext.Provider value={{ chats, addChat, removeChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChats() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChats must be used within ChatProvider');
  }
  return context;
}
