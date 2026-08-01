import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const WEB_DB_NAME = 'prorrogacao-auth';
const WEB_DB_STORE = 'tokens';

@Injectable({ providedIn: 'root' })
export class SecureStorageService {
  private readonly isNative = Capacitor.isNativePlatform();
  private memoryAccessToken: string | null = null;
  private webDbPromise: Promise<IDBDatabase> | null = null;

  async getAccessToken(): Promise<string | null> {
    return this.isNative ? this.nativeGet(ACCESS_TOKEN_KEY) : this.memoryAccessToken;
  }

  async setAccessToken(token: string): Promise<void> {
    if (this.isNative) {
      await this.nativeSet(ACCESS_TOKEN_KEY, token);
      return;
    }
    this.memoryAccessToken = token;
  }

  async removeAccessToken(): Promise<void> {
    if (this.isNative) {
      await this.nativeRemove(ACCESS_TOKEN_KEY);
      return;
    }
    this.memoryAccessToken = null;
  }

  async getRefreshToken(): Promise<string | null> {
    return this.isNative ? this.nativeGet(REFRESH_TOKEN_KEY) : this.webIdbGet(REFRESH_TOKEN_KEY);
  }

  async setRefreshToken(token: string): Promise<void> {
    if (this.isNative) {
      await this.nativeSet(REFRESH_TOKEN_KEY, token);
      return;
    }
    await this.webIdbSet(REFRESH_TOKEN_KEY, token);
  }

  async removeRefreshToken(): Promise<void> {
    if (this.isNative) {
      await this.nativeRemove(REFRESH_TOKEN_KEY);
      return;
    }
    await this.webIdbRemove(REFRESH_TOKEN_KEY);
  }

  async clear(): Promise<void> {
    await Promise.all([this.removeAccessToken(), this.removeRefreshToken()]);
  }

  private async nativeGet(key: string): Promise<string | null> {
    try {
      return await SecureStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private async nativeSet(key: string, value: string): Promise<void> {
    await SecureStorage.setItem(key, value);
  }

  private async nativeRemove(key: string): Promise<void> {
    try {
      await SecureStorage.removeItem(key);
    } catch {
      // chave já inexistente, nada a fazer
    }
  }

  private openWebDb(): Promise<IDBDatabase> {
    if (!this.webDbPromise) {
      this.webDbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(WEB_DB_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(WEB_DB_STORE);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return this.webDbPromise;
  }

  private async webIdbGet(key: string): Promise<string | null> {
    const db = await this.openWebDb();
    return new Promise((resolve) => {
      const request = db.transaction(WEB_DB_STORE, 'readonly').objectStore(WEB_DB_STORE).get(key);
      request.onsuccess = () => resolve((request.result as string | undefined) ?? null);
      request.onerror = () => resolve(null);
    });
  }

  private async webIdbSet(key: string, value: string): Promise<void> {
    const db = await this.openWebDb();
    return new Promise((resolve, reject) => {
      const request = db.transaction(WEB_DB_STORE, 'readwrite').objectStore(WEB_DB_STORE).put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async webIdbRemove(key: string): Promise<void> {
    const db = await this.openWebDb();
    return new Promise((resolve) => {
      const request = db.transaction(WEB_DB_STORE, 'readwrite').objectStore(WEB_DB_STORE).delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }
}
