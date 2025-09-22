import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';

export interface Message {
  id?: number;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  model?: string;
  metadata?: {
    temperature?: number;
    maxTokens?: number;
    tokensUsed?: number;
  };
}

export interface Conversation {
  id?: number;
  uuid: string; // Unique identifier for external references
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService extends Dexie {
  conversations!: Table<Conversation>;
  messages!: Table<Message>;

  constructor() {
    super('AIAgentDatabase');

    this.version(1).stores({
      conversations: '++id, uuid, title, createdAt, updatedAt',
      messages: '++id, conversationId, role, timestamp, content'
    });

    // Add hooks for automatic timestamp updates
    this.conversations.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.conversations.hook('updating', function (modifications, primKey, obj, trans) {
      (modifications as any).updatedAt = new Date();
    });
  }

  async createConversation(title?: string): Promise<string> {
    const uuid = this.generateUUID();
    const conversation: Conversation = {
      uuid,
      title: title || `Conversation ${await this.conversations.count() + 1}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.conversations.add(conversation);
    return uuid;
  }

  async getConversation(uuid: string): Promise<Conversation | undefined> {
    return this.conversations.where('uuid').equals(uuid).first();
  }

  async getAllConversations(): Promise<Conversation[]> {
    return this.conversations.orderBy('updatedAt').reverse().toArray();
  }

  async getConversationWithMessages(uuid: string): Promise<ConversationWithMessages | undefined> {
    const conversation = await this.getConversation(uuid);
    if (!conversation) return undefined;

    const messages = await this.messages
      .where('conversationId')
      .equals(uuid)
      .sortBy('timestamp');

    return {
      ...conversation,
      messages
    };
  }

  async getAllConversationsWithMessages(): Promise<ConversationWithMessages[]> {
    const conversations = await this.getAllConversations();
    const result: ConversationWithMessages[] = [];

    for (const conversation of conversations) {
      const messages = await this.messages
        .where('conversationId')
        .equals(conversation.uuid)
        .sortBy('timestamp');

      result.push({
        ...conversation,
        messages
      });
    }

    return result;
  }

  async addMessage(message: Omit<Message, 'id'>): Promise<number> {
    const messageId = await this.messages.add(message);

    // Update conversation's updatedAt timestamp
    await this.conversations
      .where('uuid')
      .equals(message.conversationId)
      .modify({ updatedAt: new Date() });

    return messageId;
  }

  async updateConversationTitle(uuid: string, title: string): Promise<void> {
    await this.conversations
      .where('uuid')
      .equals(uuid)
      .modify({
        title,
        updatedAt: new Date()
      });
  }

  async deleteConversation(uuid: string): Promise<void> {
    await this.transaction('rw', this.conversations, this.messages, async () => {
      // Delete all messages in this conversation
      await this.messages.where('conversationId').equals(uuid).delete();
      // Delete the conversation
      await this.conversations.where('uuid').equals(uuid).delete();
    });
  }

  async deleteAllConversations(): Promise<void> {
    await this.transaction('rw', this.conversations, this.messages, async () => {
      await this.messages.clear();
      await this.conversations.clear();
    });
  }

  async getMessagesForConversation(conversationUuid: string): Promise<Message[]> {
    return this.messages
      .where('conversationId')
      .equals(conversationUuid)
      .sortBy('timestamp');
  }

  async updateMessage(messageId: number, content: string): Promise<void> {
    await this.messages.update(messageId, {
      content,
      timestamp: new Date()
    });
  }

  async deleteMessage(messageId: number): Promise<void> {
    await this.messages.delete(messageId);
  }

  async exportConversation(uuid: string): Promise<string | null> {
    const conversation = await this.getConversationWithMessages(uuid);
    return conversation ? JSON.stringify(conversation, null, 2) : null;
  }

  async exportAllConversations(): Promise<string> {
    const conversations = await this.getAllConversationsWithMessages();
    return JSON.stringify(conversations, null, 2);
  }

  async importConversations(jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData);
      const conversations = Array.isArray(data) ? data : [data];

      await this.transaction('rw', this.conversations, this.messages, async () => {
        for (const convData of conversations) {
          if (this.isValidConversationData(convData)) {
            // Create new UUID for imported conversation to avoid conflicts
            const newUuid = this.generateUUID();

            const conversation: Conversation = {
              uuid: newUuid,
              title: convData.title,
              createdAt: new Date(convData.createdAt),
              updatedAt: new Date(convData.updatedAt)
            };

            await this.conversations.add(conversation);

            // Import messages
            if (convData.messages && Array.isArray(convData.messages)) {
              for (const msgData of convData.messages) {
                const message: Omit<Message, 'id'> = {
                  conversationId: newUuid,
                  content: msgData.content,
                  role: msgData.role,
                  timestamp: new Date(msgData.timestamp),
                  model: msgData.model,
                  metadata: msgData.metadata
                };

                await this.messages.add(message);
              }
            }
          }
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to import conversations:', error);
      return false;
    }
  }

  async getConversationCount(): Promise<number> {
    return this.conversations.count();
  }

  async getMessageCount(): Promise<number> {
    return this.messages.count();
  }

  async getDatabaseSize(): Promise<{ conversations: number; messages: number }> {
    return {
      conversations: await this.conversations.count(),
      messages: await this.messages.count()
    };
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private isValidConversationData(obj: any): boolean {
    return obj &&
           typeof obj.title === 'string' &&
           obj.createdAt &&
           obj.updatedAt;
  }
}
