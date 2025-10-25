import { getAppCacheDir } from "./cache-utils";
import fs from 'fs';
import crypto from 'crypto';
interface ConfigStore {
    pt_username: string;
    pt_password: string;
}

class Config {
    private static instance: Config;
    private configStore: ConfigStore = {
        pt_username: "",
        pt_password: "",
    };
    private config_path: string = "";
    
    // 加密密钥和算法
    private readonly ENCRYPTION_KEY = 'bear-electron-config-key-2024'; // 32字符密钥
    private readonly ALGORITHM = 'aes-256-cbc';

    private constructor() {
        this.initConfig();
    }

    private initConfig() {
        this.config_path = getAppCacheDir() + '/config.json';
        console.log("config path:", this.config_path);
        if (fs.existsSync(this.config_path)) {
            const config_json = fs.readFileSync(this.config_path, 'utf-8');
            this.configStore = JSON.parse(config_json);
        } else {
            this.saveConfig();
        }
    }

    private saveConfig() {
        if (this.config_path) {
            fs.writeFileSync(this.config_path, JSON.stringify(this.configStore, null, 2));
        }
    }

    // 加密密码
    private encryptPassword(password: string): string {
        if (!password) return '';
        
        try {
            const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
            
            let encrypted = cipher.update(password, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            // 将IV和加密数据组合
            return iv.toString('hex') + ':' + encrypted;
        } catch (error) {
            console.error('Password encryption failed:', error);
            return password; // 加密失败时返回原密码
        }
    }
    
    // 解密密码
    private decryptPassword(encryptedPassword: string): string {
        if (!encryptedPassword) return '';
        
        try {
            // 检查是否是加密格式（包含冒号分隔符）
            if (!encryptedPassword.includes(':')) {
                return encryptedPassword; // 可能是未加密的旧密码
            }
            
            const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
            const parts = encryptedPassword.split(':');
            const iv = Buffer.from(parts[0], 'hex');
            const encrypted = parts[1];
            
            const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('Password decryption failed:', error);
            return encryptedPassword; // 解密失败时返回原值
        }
    }

    public static getInstance(): Config {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }
    public getPtUsername(): string {
        return this.configStore.pt_username;
    }

    public getPtPassword(): string {
        return this.decryptPassword(this.configStore.pt_password);
    }

    public setPtUsername(username: string) {
        this.configStore.pt_username = username;
        this.saveConfig();
    }

    public setPtPassword(password: string) {
        this.configStore.pt_password = this.encryptPassword(password);
        this.saveConfig();
    }
}

export const config = Config.getInstance();