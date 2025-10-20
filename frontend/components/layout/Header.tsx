'use client';

import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface HeaderProps { onReset?: () => void; onToggleSidebar?: () => void }

export default function Header({ onReset, onToggleSidebar }: HeaderProps) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check initial dark mode preference
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.remove('dark');
    } else {
      html.classList.add('dark');
    }
    setDarkMode(!darkMode);
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer select-none" onClick={onReset}>
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Sun className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                SunPath & Shadow Simulator
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                태양 경로 · 일조량 · 그림자 시뮬레이터
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Mobile: Sidebar Toggle */}
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors md:hidden"
              aria-label="Open sidebar"
            >
              <span className="block w-5 h-0.5 bg-gray-700 dark:bg-gray-300 mb-1"></span>
              <span className="block w-5 h-0.5 bg-gray-700 dark:bg-gray-300 mb-1"></span>
              <span className="block w-5 h-0.5 bg-gray-700 dark:bg-gray-300"></span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>

            {/* API Status */}
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                API 연결됨
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
