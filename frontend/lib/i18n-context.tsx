'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Locale } from './i18n';
import { getInitialLocale, setStoredLocale, loadMessages } from './i18n';
import type { Messages } from './i18n';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: Messages;
  t: (path: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

// 간단한 번역 함수
function translate(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let value: unknown = obj;
  
  for (const key of keys) {
    if (value == null || typeof value !== 'object') return path;
    if (!(key in value)) return path;
    value = (value as Record<string, unknown>)[key];
  }
  
  return typeof value === 'string' ? value : path;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // SSR 호환: 초기값을 기본 언어로 설정
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      return getInitialLocale();
    }
    return 'ko';
  });
  
  const [messages, setMessages] = useState<Messages>({} as Messages);

  useEffect(() => {
    // 클라이언트에서만 실행
    if (typeof window === 'undefined') {
      return;
    }
    
    // 초기 언어 설정
    const initialLocale = getInitialLocale();
    setLocaleState(initialLocale);
    
    // HTML lang 속성 초기 설정
    document.documentElement.lang = initialLocale === 'ko' ? 'ko' : 'en';
    
    // 초기 메시지 로드
    loadMessages(initialLocale).then((msg) => {
      setMessages(msg.default);
      
      // 페이지 제목 동적으로 업데이트 (클라이언트 전용)
      if (msg.default.seo) {
        document.title = msg.default.seo.title;
      }
    });
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    setStoredLocale(newLocale);
    
    // HTML lang 속성 동적으로 변경 (클라이언트 전용)
    if (typeof window !== 'undefined') {
      document.documentElement.lang = newLocale === 'ko' ? 'ko' : 'en';
    }
    
    // 새 언어의 메시지 로드
    loadMessages(newLocale).then((msg) => {
      setMessages(msg.default);
      
      // 페이지 제목 동적으로 업데이트 (클라이언트 전용)
      if (typeof window !== 'undefined' && msg.default.seo) {
        document.title = msg.default.seo.title;
      }
    });
  };

  // 로딩 중이거나 메시지가 없을 때 기본 동작
  const t = (path: string): string => {
    if (Object.keys(messages).length === 0) {
      return path; // 메시지가 없으면 경로 반환
    }
    return translate(messages, path);
  };

  const value: I18nContextValue = {
    locale,
    setLocale,
    messages,
    t,
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

