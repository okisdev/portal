export type Locale = 'en' | 'zh-HK' | 'zh-CN';

export type LocaleMessages = {
  [key in Locale]: Record<string, string>;
};
