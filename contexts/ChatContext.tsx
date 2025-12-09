import { AuthContext } from '@/contexts/authContext';
import { supabase } from '@/utils/supabaseClient';
import { useRouter } from 'expo-router';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export type Chat = {
  id: string;
  name: string;        // what you show in the drawer
  status: 'pending' | 'ready' | 'error';
  product_id?: string | null;
  generated_on?: string | null;
};

type ChatContextType = {
  chats: Chat[];
  loading: boolean;
  addChatAndNavigate: (query: string) => Promise<void>;
  removeChat: (id: string) => Promise<void>;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext); // profiles.id
  const router = useRouter();

  // 1) Load existing chats for the logged-in user
  useEffect(() => {
    if (!user?.id) return;

    const loadChats = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('chats')
        .select('id, user_query, status, product_id, generated_on')
        .eq('queried_by', user.id)
        .order('generated_on', { ascending: false });

      if (error) {
        console.error('Error loading chats:', error);
        setLoading(false);
        return;
      }
      console.log(data);

      const mapped: Chat[] = (data || []).map((row) => ({
        id: row.id,
        name:
          row.user_query?.length > 30
            ? row.user_query.slice(0, 30) + '...'
            : row.user_query || 'Query',
        status: (row.status as Chat['status']) || 'pending',
        product_id: row.product_id,
        generated_on: row.generated_on,
      }));

      setChats(mapped);
      setLoading(false);
    };

    loadChats();
  }, [user?.id]);

  // 2) Create pending chat row, fire backend, and navigate
  const addChatAndNavigate = useCallback(
    async (query: string) => {
      if (!user?.id) return;

      const trimmed = query.trim();
      if (!trimmed) return;

      // a) create pending row
      const { data, error } = await supabase
        .from('chats')
        .insert({
          queried_by: user.id,
          user_query: trimmed,
          status: 'pending',
          product_id: null,
          summary: null,
        })
        .select('id, user_query, status')
        .single();

      if (error || !data) {
        console.error('Error creating chat:', error);
        throw error;
      }

      const chatId = data.id as string;
      const chatName =
        trimmed.length > 30 ? trimmed.slice(0, 30) + '...' : trimmed;

      // Optimistically add to local list so drawer updates immediately
      setChats((prev) => [
        {
          id: chatId,
          name: chatName,
          status: 'pending',
          product_id: null,
          generated_on: null,
        },
        ...prev,
      ]);

      // Navigate to the new chat route with the initial query
      router.push({
        pathname: '/(protected)/(chats)/[chatid]',
        params: {
          chatid: chatId,
          chatName: chatName,
          initialQuery: query,
        }
      });
    },
    [user?.id]
  );

  // 3) Remove chat row
  const removeChat = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', id)
        .eq('queried_by', user!.id);

      if (error) {
        console.error('Error deleting chat:', error);
        throw error;
      }

      setChats((prev) => prev.filter((c) => c.id !== id));
    },
    [user?.id]
  );

  return (
    <ChatContext.Provider value={{ chats, loading, addChatAndNavigate, removeChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChats() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChats must be used within ChatProvider');
  }
  return ctx;
}
