import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';

const SECRET_KEY_LOCAL_STORAGE = 'iOYUg1}T+P>QiAni<yO,e0;kMkMl3*N_';
export class LocalStorageUtils {
  static setItem(key: string, value: any): void {
    try {
      const jsonData = JSON.stringify(value);
      const encrypted = AES.encrypt(
        jsonData,
        SECRET_KEY_LOCAL_STORAGE
      ).toString();
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error(`SetItem failed for key "${key}"`, error);
    }
  }

  static getItem(key: string): any | null {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      const decrypted = AES.decrypt(
        encrypted,
        SECRET_KEY_LOCAL_STORAGE
      ).toString(Utf8);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error(`Lỗi khi lấy dữ liệu key "${key}" từ LocalStorage`, error);
      return null;
    }
  }

  static removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  static clear(): void {
    const deviceToken = localStorage.getItem('xw_device_token');
    const guestId = localStorage.getItem('xw_guest_id');
    const guestName = localStorage.getItem('xw_guest_name');
    localStorage.clear();
    if (deviceToken) {
      localStorage.setItem('xw_device_token', deviceToken);
    }
    if (guestId) {
      localStorage.setItem('xw_guest_id', guestId);
    }
    if (guestName) {
      localStorage.setItem('xw_guest_name', guestName);
    }
  }

  static exists(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  static debugDecrypt(key: string): string | null {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      return AES.decrypt(encrypted, SECRET_KEY_LOCAL_STORAGE).toString(Utf8);
    } catch (error) {
      console.warn(`DebugDecrypt failed for key "${key}"`, error);
      return null;
    }
  }
}
