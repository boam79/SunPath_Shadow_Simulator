'use client';

import { useState } from 'react';
import { FileDown, AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';
import { exportToPDFSimple } from '@/lib/pdfExport';
import type { SolarCalculationResponse } from '@/lib/api';

interface PDFExportProps {
  solarData?: SolarCalculationResponse | null;
}

export default function PDFExport({ solarData }: PDFExportProps) {
  const { t } = useI18n();
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!solarData) return;

    setIsExporting(true);
    setError(null);

    try {
      await exportToPDFSimple(solarData);
    } catch (err) {
      console.error('PDF export error:', err);
      setError('PDF 생성에 실패했습니다. jspdf 라이브러리가 설치되어 있는지 확인하세요.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleExport}
        disabled={isExporting || !solarData}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            <span>PDF 생성 중...</span>
          </>
        ) : (
          <>
            <FileDown className="w-4 h-4" />
            <span>PDF 다운로드</span>
          </>
        )}
      </button>

      {error && (
        <div className="flex items-start space-x-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-red-800 dark:text-red-400">{error}</p>
            <p className="text-xs text-red-700 dark:text-red-500 mt-1">
              npm install jspdf로 설치해주세요.
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        ⚠️ PDF 생성 기능은 jsPDF 라이브러리가 필요합니다.
      </p>
    </div>
  );
}

