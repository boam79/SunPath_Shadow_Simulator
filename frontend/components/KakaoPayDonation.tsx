'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

interface KakaoPayDonationProps {
  isMobile: boolean;
  className?: string;
  variant?: 'button' | 'link';
}

export default function KakaoPayDonation({ 
  isMobile, 
  className = '',
  variant = 'button'
}: KakaoPayDonationProps) {
  const { t } = useI18n();
  const [showModal, setShowModal] = useState(false);
  const kakaopayUrl = 'https://qr.kakaopay.com/Ej8dj4X39';

  const handleClick = (e: React.MouseEvent) => {
    if (isMobile) {
      // 모바일에서는 링크로 바로 이동
      window.open(kakaopayUrl, '_blank', 'noopener,noreferrer');
    } else {
      // 데스크톱에서는 모달로 QR 코드 표시
      e.preventDefault();
      setShowModal(true);
    }
  };

  return (
    <>
      <a
        href={kakaopayUrl}
        onClick={handleClick}
        target={isMobile ? '_blank' : undefined}
        rel="noopener noreferrer"
        className={className}
        title={!isMobile ? t('donationModal.instruction').replace('\n', ' ') : undefined}
      >
        {variant === 'button' ? (
          <div className="flex flex-col items-center justify-center space-y-1">
            <span className="text-sm font-medium">☕ {t('donation.title')}</span>
            {!isMobile && (
              <span className="text-xs text-gray-700">({t('donation.desktopHint')})</span>
            )}
          </div>
        ) : (
          <>
            <span>☕ {t('donation.title')}</span>
            {!isMobile && (
              <span className="text-xs text-gray-700 md:hidden">({t('donation.desktopHint')})</span>
            )}
          </>
        )}
      </a>

      {/* QR 코드 모달 (데스크톱 전용) */}
      {showModal && !isMobile && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('donationModal.title')}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <QRCodeSVG 
                  value={kakaopayUrl}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {t('donationModal.instruction')}
                </p>
                <a
                  href={kakaopayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {t('donationModal.openLink')} →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

