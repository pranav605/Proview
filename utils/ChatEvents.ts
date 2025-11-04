type Listener = (chatId: string) => void;

class ChatEventEmitter {
  private listeners: Listener[] = [];

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit(chatId: string) {
    this.listeners.forEach(listener => listener(chatId));
  }
}

export const chatEvents = new ChatEventEmitter();
