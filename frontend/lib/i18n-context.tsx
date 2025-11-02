'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Locale } from './i18n';
import { getInitialLocale, setStoredLocale, loadMessages } from './i18n';
import type { Messages } from './i18n';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: Messages;
  t: typeof translate;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

// 간단한 번역 함수
function translate(obj: any, path: string): string {
  const keys = path.split('.');
  let value: any = obj;
  
  for (const key of keys) {
    if (value == null) return path;
    value = value[key];
  }
  
  return typeof value === 'string' ? value : path;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ko');
  const [messages, setMessages] = useState<Messages>({} as Messages);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 초기 언어 설정
    const initialLocale = getInitialLocale();
    setLocaleState(initialLocale);
    
    // 초기 메시지 로드
    loadMessages(initialLocale).then((msg) => {
      setMessages(msg.default);
      setIsLoading(false);
    });
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    setStoredLocale(newLocale);
    
    // 새 언어의 메시지 로드
    loadMessages(newLocale).then((msg) => {
      setMessages(msg.default);
    });
  };

  if (isLoading) {
    return <>{children}</>; // 로딩 중에는 기본 렌더링
  }

  const value: I18nContextValue = {
    locale,
    setLocale,
    messages,
    t: (path: string) => translate(messages, path),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

