'use client';

import { useState } from 'react';
import { Loader2, Plus, Trash2, Play, AlertCircle, CheckCircle, X } from 'lucide-react';
import { calculateBatch, type SolarCalculationRequest, type BatchCalculationResponse } from '@/lib/api';

interface BatchCalculatorProps {
  onBatchComplete?: (results: BatchCalculationResponse) => void;
}

export default function BatchCalculator({ onBatchComplete }: BatchCalculatorProps) {
  const [requests, setRequests] = useState<SolarCalculationRequest[]>([
    {
      location: { lat: 37.5665, lon: 126.9780 },
      datetime: { date: new Date().toISOString().split('T')[0] },
      object: { height: 10 }
    }
  ]);
  const [parallel, setParallel] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<BatchCalculationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addRequest = () => {
    setRequests([...requests, {
      location: { lat: 37.5665, lon: 126.9780 },
      datetime: { date: new Date().toISOString().split('T')[0] },
      object: { height: 10 }
    }]);
  };

  const removeRequest = (index: number) => {
    if (requests.length > 1) {
      setRequests(requests.filter((_, i) => i !== index));
    }
  };

  const updateRequest = (index: number, field: string, value: string | number) => {
    const newRequests = [...requests];
    const request = { ...newRequests[index] };
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (request as any)[parent] = { ...(request as any)[parent], [child]: value };
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (request as any)[field] = value;
    }
    
    newRequests[index] = request;
    setRequests(newRequests);
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    setError(null);
    setResults(null);

    try {
      const response = await calculateBatch(requests, parallel);
      setResults(response);
      if (onBatchComplete) {
        onBatchComplete(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch calculation failed');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          배치 계산
        </h3>
        <button
          onClick={addRequest}
          className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>추가</span>
        </button>
      </div>

      {/* Request Items */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {requests.map((req, index) => (
          <div key={index} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                위치 {index + 1}
              </span>
              {requests.length > 1 && (
                <button
                  onClick={() => removeRequest(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-gray-600 dark:text-gray-400">위도</label>
                <input
                  type="number"
                  value={req.location.lat}
                  onChange={(e) => updateRequest(index, 'location.lat', parseFloat(e.target.value))}
                  step="0.0001"
                  className="w-full px-2 py-1 mt-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-gray-600 dark:text-gray-400">경도</label>
                <input
                  type="number"
                  value={req.location.lon}
                  onChange={(e) => updateRequest(index, 'location.lon', parseFloat(e.target.value))}
                  step="0.0001"
                  className="w-full px-2 py-1 mt-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-gray-600 dark:text-gray-400">날짜</label>
                <input
                  type="date"
                  value={req.datetime.date}
                  onChange={(e) => updateRequest(index, 'datetime.date', e.target.value)}
                  className="w-full px-2 py-1 mt-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-gray-600 dark:text-gray-400">높이 (m)</label>
                <input
                  type="number"
                  value={req.object?.height || 10}
                  onChange={(e) => updateRequest(index, 'object.height', parseFloat(e.target.value))}
                  step="0.1"
                  min="0.1"
                  max="1000"
                  className="w-full px-2 py-1 mt-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Parallel Processing Toggle */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="parallel"
          checked={parallel}
          onChange={(e) => setParallel(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="parallel" className="text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
          병렬 처리 (빠름)
        </label>
      </div>

      {/* Calculate Button */}
      <button
        onClick={handleCalculate}
        disabled={isCalculating || requests.length === 0}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
      >
        {isCalculating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>계산 중...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            <span>계산 시작 ({requests.length}개)</span>
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="flex items-start space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-red-800 dark:text-red-300">오류</p>
            <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
          </div>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-300">결과</h4>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs text-blue-800 dark:text-blue-400">
                {results.successful}/{results.total_requests} 성공
              </span>
            </div>
          </div>
          <div className="space-y-1 text-xs text-blue-800 dark:text-blue-400">
            <p>• 총 요청: {results.total_requests}개</p>
            <p>• 성공: {results.successful}개</p>
            <p>• 실패: {results.failed}개</p>
            <p>• 소요 시간: {results.processing_time_ms.toFixed(0)}ms</p>
          </div>
          
          {/* Results Details */}
          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
            {results.results.map((item, idx) => (
              <div
                key={idx}
                className={`p-2 rounded text-xs ${
                  item.success
                    ? 'bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  {item.success ? (
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-red-600" />
                  )}
                  <span className="font-medium">
                    위치 {idx + 1} ({item.success ? '성공' : '실패'})
                  </span>
                </div>
                {item.success && item.result && (
                  <div className="ml-5 text-gray-700 dark:text-gray-400">
                    <p>최대 고도: {item.result.summary.max_altitude.toFixed(1)}°</p>
                    <p>총 일사량: {item.result.summary.total_irradiance?.toFixed(2)} kWh/m²</p>
                  </div>
                )}
                {!item.success && item.error && (
                  <p className="ml-5 text-red-700 dark:text-red-400 text-xs">{item.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

