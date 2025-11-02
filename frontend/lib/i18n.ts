// 간단한 i18n 구현
export type Locale = 'ko' | 'en';

export const locales: Locale[] = ['ko', 'en'];
export const defaultLocale: Locale = 'ko';

// 언어 표시 이름
export const localeNames: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
};

// 번역 메시지 타입
export type Messages = typeof import('../i18n/locales/ko/messages').default;

// 번역 메시지 로드
export function loadMessages(locale: Locale): Promise<{ default: Messages }> {
  return import(`../i18n/locales/${locale}/messages`);
}

// 로컬 스토리지에서 언어 설정 가져오기
export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  
  const stored = localStorage.getItem('locale') as Locale | null;
  return stored && locales.includes(stored) ? stored : defaultLocale;
}

// 로컬 스토리지에 언어 설정 저장
export function setStoredLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('locale', locale);
}

// 브라우저 언어 감지
export function getBrowserLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  
  const browserLang = navigator.language.toLowerCase();
  
  if (browserLang.startsWith('ko')) return 'ko';
  if (browserLang.startsWith('en')) return 'en';
  
  return defaultLocale;
}

// 초기 언어 설정 (브라우저 언어 또는 저장된 언어)
export function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  
  const stored = getStoredLocale();
  if (stored) return stored;
  
  return getBrowserLocale();
}

