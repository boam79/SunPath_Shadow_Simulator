'use client';

import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

interface TimelineProps {
  currentTime: string;
  onTimeChange: (time: string) => void;
  startTime?: string;
  endTime?: string;
  isPlaying?: boolean;
  onPlayPause?: () => void;
}

export default function Timeline({
  currentTime,
  onTimeChange,
  startTime = '00:00',
  endTime = '23:59',
  isPlaying = false,
  onPlayPause
}: TimelineProps) {
  const [playSpeed, setPlaySpeed] = useState<number>(1);
  const [internalPlaying, setInternalPlaying] = useState(false);
  
  // useRef로 최신 값 참조하여 interval 재생성 방지
  const playSpeedRef = useRef(playSpeed);
  const currentTimeRef = useRef(currentTime);
  const endMinutesRef = useRef(0);

  // playSpeed가 변경될 때 ref 업데이트
  useEffect(() => {
    playSpeedRef.current = playSpeed;
  }, [playSpeed]);

  // currentTime이 변경될 때 ref 업데이트
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  const playing = isPlaying !== undefined ? isPlaying : internalPlaying;

  // Convert time string to minutes with improved error handling
  const timeToMinutes = useCallback((time: string): number => {
    if (!time || typeof time !== 'string') {
      console.error(`Invalid time input: ${time}`);
      return 0;
    }

    const parts = time.split(':');
    if (parts.length < 2 || parts.length > 2) {
      console.error(`Invalid time format: ${time} (expected HH:MM)`);
      return 0;
    }

    const hoursStr = parts[0]?.trim();
    const minutesStr = parts[1]?.trim();

    if (!hoursStr || !minutesStr) {
      console.error(`Invalid time format: ${time} (missing hours or minutes)`);
      return 0;
    }

    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (isNaN(hours) || isNaN(minutes)) {
      console.error(`Invalid time format: ${time} (non-numeric values)`);
      return 0;
    }

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.error(`Time out of range: ${time}`);
      return Math.max(0, Math.min(1439, hours * 60 + minutes));
    }

    return hours * 60 + minutes;
  }, []);

  // Convert minutes to time string with range validation
  const minutesToTime = useCallback((minutes: number): string => {
    // Clamp to valid day range (0-1439 minutes = 0:00-23:59)
    const clampedMinutes = Math.max(0, Math.min(1439, Math.round(minutes)));
    const hours = Math.floor(clampedMinutes / 60) % 24;
    const mins = clampedMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }, []);

  const currentMinutes = timeToMinutes(currentTime);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  // endMinutes ref 업데이트
  useEffect(() => {
    endMinutesRef.current = endMinutes;
  }, [endMinutes]);

  // Validate play speed
  const setPlaySpeedSafe = useCallback((speed: number) => {
    // Only allow positive speeds between 0.1 and 10
    const validatedSpeed = Math.max(0.1, Math.min(10, speed));
    if (validatedSpeed !== speed) {
      console.warn(`Play speed clamped from ${speed} to ${validatedSpeed}`);
    }
    setPlaySpeed(validatedSpeed);
  }, []);

  // Animation loop with useRef to avoid interval recreation
  useEffect(() => {
    if (!playing) return;

    const interval = setInterval(() => {
      // Use ref to get latest values without recreating interval
      const current = timeToMinutes(currentTimeRef.current);
      const speed = playSpeedRef.current;
      const end = endMinutesRef.current;
      
      // 30fps: each frame advances by (playSpeed / 30) minutes
      // 1x speed = 1 minute per second = 1/30 per frame
      // 0.5x speed = 0.5 minutes per second = 0.5/30 per frame
      const minutesPerFrame = speed / 30;
      const next = current + minutesPerFrame;

      if (next >= end) {
        // Reached end, stop
        setInternalPlaying(false);
        onPlayPause?.();
      } else {
        onTimeChange(minutesToTime(next));
      }
    }, 1000 / 30); // 30fps

    return () => clearInterval(interval);
  }, [playing, onTimeChange, onPlayPause, timeToMinutes, minutesToTime]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const minutes = parseInt(e.target.value);
    onTimeChange(minutesToTime(minutes));
  };

  const handlePlayPause = () => {
    if (onPlayPause) {
      onPlayPause();
    } else {
      setInternalPlaying(!playing);
    }
  };

  const handleStepBackward = () => {
    const current = timeToMinutes(currentTime);
    const prev = Math.max(startMinutes, current - 60); // 1 hour back
    onTimeChange(minutesToTime(prev));
  };

  const handleStepForward = () => {
    const current = timeToMinutes(currentTime);
    const next = Math.min(endMinutes, current + 60); // 1 hour forward
    onTimeChange(minutesToTime(next));
  };

  const handleReset = () => {
    onTimeChange(startTime);
    setInternalPlaying(false);
    onPlayPause?.();
  };

  // Calculate safe gradient percentages with division by zero protection
  const getGradientStyle = () => {
    const timeRange = endMinutes - startMinutes;
    if (timeRange <= 0) {
      return 'linear-gradient(to right, #1e3a8a 0%, #1e3a8a 100%)';
    }
    const hour6Percent = ((6 * 60 - startMinutes) / timeRange) * 100;
    const hour12Percent = ((12 * 60 - startMinutes) / timeRange) * 100;
    const hour18Percent = ((18 * 60 - startMinutes) / timeRange) * 100;
    return `linear-gradient(to right, 
      #1e3a8a 0%, 
      #3b82f6 ${Math.max(0, Math.min(100, hour6Percent))}%,
      #fbbf24 ${Math.max(0, Math.min(100, hour12Percent))}%,
      #f97316 ${Math.max(0, Math.min(100, hour18Percent))}%,
      #1e3a8a 100%)`;
  };

  // Calculate safe indicator position with division by zero protection
  const getIndicatorPosition = () => {
    const timeRange = endMinutes - startMinutes;
    if (timeRange <= 0) return '50%';
    const percent = ((currentMinutes - startMinutes) / timeRange) * 100;
    return `${Math.max(0, Math.min(100, percent))}%`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 md:p-4">
      <div className="max-w-7xl mx-auto space-y-3 md:space-y-4">
        {/* Timeline Slider */}
        <div className="flex items-center space-x-4">
          <span className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 w-12 md:w-16">
            {startTime}
          </span>
          
          <div className="flex-1 relative">
            <input
              type="range"
              min={startMinutes}
              max={endMinutes}
              value={currentMinutes}
              onChange={handleSliderChange}
              className="w-full h-2 bg-gradient-to-r from-blue-900 via-yellow-400 to-orange-600 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              style={{
                background: getGradientStyle()
              }}
            />
            
            {/* Current Time Indicator */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-gray-200 border-2 border-yellow-500 rounded-full shadow-lg pointer-events-none"
              style={{
                left: getIndicatorPosition(),
                transform: 'translateX(-50%) translateY(-50%)'
              }}
            />
          </div>
          
          <span className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400 w-12 md:w-16 text-right">
            {endTime}
          </span>
        </div>

        {/* Current Time Display */}
        <div className="text-center">
          <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {currentTime}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            현재 시각
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-3 md:space-x-4">
          {/* Reset */}
          <button
            onClick={handleReset}
            className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="처음으로"
          >
            <SkipBack className="w-4 h-4 md:w-5 md:h-5 text-gray-700 dark:text-gray-300" />
          </button>

          {/* Step Backward */}
          <button
            onClick={handleStepBackward}
            className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="1시간 뒤로"
          >
            <span className="text-lg md:text-xl font-bold text-gray-700 dark:text-gray-300">-1h</span>
          </button>

          {/* Play/Pause */}
          <button
            onClick={handlePlayPause}
            className="p-3 md:p-4 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
            title={playing ? "일시정지" : "재생"}
          >
            {playing ? (
              <Pause className="w-5 h-5 md:w-6 md:h-6 text-white" fill="white" />
            ) : (
              <Play className="w-5 h-5 md:w-6 md:h-6 text-white" fill="white" />
            )}
          </button>

          {/* Step Forward */}
          <button
            onClick={handleStepForward}
            className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="1시간 앞으로"
          >
            <span className="text-lg md:text-xl font-bold text-gray-700 dark:text-gray-300">+1h</span>
          </button>

          {/* End */}
          <button
            onClick={() => onTimeChange(endTime)}
            className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="마지막으로"
          >
            <SkipForward className="w-4 h-4 md:w-5 md:h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Speed Control */}
        <div className="flex items-center justify-center space-x-1.5 md:space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">재생 속도:</span>
          {[0.5, 1, 2, 5].map((speed) => (
            <button
              key={speed}
              onClick={() => setPlaySpeedSafe(speed)}
              className={`px-2.5 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs rounded-full transition-colors ${
                playSpeed === speed
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
