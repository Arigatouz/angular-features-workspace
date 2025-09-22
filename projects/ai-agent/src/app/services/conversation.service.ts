import { Injectable, signal, computed, inject } from '@angular/core';
import { DatabaseService, Message, Conversation, ConversationWithMessages } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  private readonly db = inject(DatabaseService);
  private readonly conversations = signal<ConversationWithMessages[]>([]);
  private readonly activeConversationUuid = signal<string | null>(null);

  readonly allConversations = this.conversations.asReadonly();
  readonly activeConversation = computed(() => {
    const uuid = this.activeConversationUuid();
    return uuid ? this.conversations().find(conv => conv.uuid === uuid) || null : null;
  });

  readonly activeMessages = computed(() => {
    return this.activeConversation()?.messages || [];
  });

  constructor() {
    this.loadConversationsFromDatabase();
  }

  async createConversation(title?: string): Promise<string> {
    try {
      const uuid = await this.db.createConversation(title);
      this.activeConversationUuid.set(uuid);
      await this.loadConversationsFromDatabase();
      return uuid;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  }

  async selectConversation(uuid: string): Promise<boolean> {
    try {
      const conversation = await this.db.getConversation(uuid);
      if (conversation) {
        this.activeConversationUuid.set(uuid);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to select conversation:', error);
      return false;
    }
  }

  async addMessage(content: string, role: 'user' | 'assistant', metadata?: Message['metadata']): Promise<void> {
    try {
      let conversationUuid = this.activeConversationUuid();

      if (!conversationUuid) {
        // Create new conversation if none exists
        conversationUuid = await this.createConversation();
      }

      const message: Omit<Message, 'id'> = {
        conversationId: conversationUuid,
        content,
        role,
        timestamp: new Date(),
        metadata
      };

      await this.db.addMessage(message);

      // Update the conversation title if this is the first user message
      const existingConversation = this.conversations().find(conv => conv.uuid === conversationUuid);
      if (existingConversation && existingConversation.messages.length === 0 && role === 'user') {
        const title = this.generateTitle(content);
        await this.db.updateConversationTitle(conversationUuid, title);
      }

      await this.loadConversationsFromDatabase();
    } catch (error) {
      console.error('Failed to add message:', error);
      throw error;
    }
  }

  async updateLastMessage(content: string): Promise<void> {
    try {
      const conversationUuid = this.activeConversationUuid();
      if (!conversationUuid) return;

      const messages = await this.db.getMessagesForConversation(conversationUuid);
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.id) {
          await this.db.updateMessage(lastMessage.id, content);
          await this.loadConversationsFromDatabase();
        }
      }
    } catch (error) {
      console.error('Failed to update last message:', error);
      throw error;
    }
  }

  async deleteConversation(uuid: string): Promise<void> {
    try {
      await this.db.deleteConversation(uuid);

      if (this.activeConversationUuid() === uuid) {
        const remaining = await this.db.getAllConversations();
        this.activeConversationUuid.set(remaining.length > 0 ? remaining[0].uuid : null);
      }

      await this.loadConversationsFromDatabase();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  }

  async clearAllConversations(): Promise<void> {
    try {
      await this.db.deleteAllConversations();
      this.conversations.set([]);
      this.activeConversationUuid.set(null);
    } catch (error) {
      console.error('Failed to clear all conversations:', error);
      throw error;
    }
  }

  async renameConversation(uuid: string, newTitle: string): Promise<void> {
    try {
      await this.db.updateConversationTitle(uuid, newTitle);
      await this.loadConversationsFromDatabase();
    } catch (error) {
      console.error('Failed to rename conversation:', error);
      throw error;
    }
  }

  async exportConversation(uuid: string): Promise<string | null> {
    try {
      return await this.db.exportConversation(uuid);
    } catch (error) {
      console.error('Failed to export conversation:', error);
      return null;
    }
  }

  async exportAllConversations(): Promise<string> {
    try {
      return await this.db.exportAllConversations();
    } catch (error) {
      console.error('Failed to export all conversations:', error);
      return JSON.stringify([], null, 2);
    }
  }

  async importConversations(jsonData: string): Promise<boolean> {
    try {
      const success = await this.db.importConversations(jsonData);
      if (success) {
        await this.loadConversationsFromDatabase();
      }
      return success;
    } catch (error) {
      console.error('Failed to import conversations:', error);
      return false;
    }
  }

  async getDatabaseStats(): Promise<{ conversations: number; messages: number }> {
    try {
      return await this.db.getDatabaseSize();
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return { conversations: 0, messages: 0 };
    }
  }

  // Migration method to transfer localStorage data to IndexedDB
  async migrateFromLocalStorage(): Promise<boolean> {
    try {
      const saved = localStorage.getItem('ai-agent-conversations');
      const activeId = localStorage.getItem('ai-agent-active-conversation');

      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Convert old format to new format
          for (const oldConv of parsed) {
            if (this.isValidOldConversation(oldConv)) {
              const uuid = await this.db.createConversation(oldConv.title);

              // Add all messages
              for (const oldMsg of oldConv.messages) {
                const message: Omit<Message, 'id'> = {
                  conversationId: uuid,
                  content: oldMsg.content,
                  role: oldMsg.role,
                  timestamp: new Date(oldMsg.timestamp),
                  model: oldMsg.model,
                  metadata: oldMsg.metadata
                };
                await this.db.addMessage(message);
              }

              // Set active conversation if this was the active one
              if (activeId === oldConv.id) {
                this.activeConversationUuid.set(uuid);
              }
            }
          }

          // Clear localStorage after successful migration
          localStorage.removeItem('ai-agent-conversations');
          localStorage.removeItem('ai-agent-active-conversation');

          await this.loadConversationsFromDatabase();
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Failed to migrate from localStorage:', error);
      return false;
    }
  }

  private async loadConversationsFromDatabase(): Promise<void> {
    try {
      const conversationsWithMessages = await this.db.getAllConversationsWithMessages();
      this.conversations.set(conversationsWithMessages);

      // If no active conversation is set but we have conversations, set the first one
      if (!this.activeConversationUuid() && conversationsWithMessages.length > 0) {
        this.activeConversationUuid.set(conversationsWithMessages[0].uuid);
      }
    } catch (error) {
      console.error('Failed to load conversations from database:', error);
    }
  }

  private generateTitle(firstMessage: string): string {
    // Generate a title from first message (first 50 chars)
    const title = firstMessage.substring(0, 50).trim();
    return title.length === firstMessage.length ? title : title + '...';
  }

  private isValidOldConversation(obj: any): boolean {
    return obj &&
           typeof obj.id === 'string' &&
           typeof obj.title === 'string' &&
           Array.isArray(obj.messages) &&
           obj.createdAt &&
           obj.updatedAt;
  }
}