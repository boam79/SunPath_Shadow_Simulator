'use client';

import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n-context';

// Development mode check
const isDevelopment = process.env.NODE_ENV === 'development';

// Helper function for development-only logging
const devLog = (...args: unknown[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

interface TimelineProps {
  currentTime: string;
  onTimeChange: (time: string) => void;
  startTime?: string;
  endTime?: string;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  variant?: 'default' | 'sidebar';
}

export default function Timeline({
  currentTime,
  onTimeChange,
  startTime = '00:00',
  endTime = '23:59',
  isPlaying = false,
  onPlayPause,
  variant = 'default'
}: TimelineProps) {
  const { t } = useI18n();
  const [playSpeed, setPlaySpeed] = useState<number>(1);
  const [internalPlaying, setInternalPlaying] = useState(false);
  
  // useRef로 최신 값 참조하여 interval 재생성 방지
  const playSpeedRef = useRef(playSpeed);
  const currentTimeRef = useRef(currentTime);
  // Accumulate fractional minutes so animation progresses smoothly
  const accumulatedMinutesRef = useRef<number>(0);
  const endMinutesRef = useRef(0);

  // Convert time string to minutes with improved error handling
  const timeToMinutes = useCallback((time: string): number => {
    if (!time || typeof time !== 'string') {
      if (isDevelopment) {
        console.error(`Invalid time input: ${time}`);
      }
      return 0;
    }

    const parts = time.split(':');
    if (parts.length < 2 || parts.length > 2) {
      if (isDevelopment) {
        console.error(`Invalid time format: ${time} (expected HH:MM)`);
      }
      return 0;
    }

    const hoursStr = parts[0]?.trim();
    const minutesStr = parts[1]?.trim();

    if (!hoursStr || !minutesStr) {
      if (isDevelopment) {
        console.error(`Invalid time format: ${time} (missing hours or minutes)`);
      }
      return 0;
    }

    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (isNaN(hours) || isNaN(minutes)) {
      if (isDevelopment) {
        console.error(`Invalid time format: ${time} (non-numeric values)`);
      }
      return 0;
    }

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      if (isDevelopment) {
        console.error(`Time out of range: ${time}`);
      }
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

  // playSpeed가 변경될 때 ref 업데이트
  useEffect(() => {
    playSpeedRef.current = playSpeed;
  }, [playSpeed]);

  const playing = isPlaying !== undefined ? isPlaying : internalPlaying;

  // currentTime이 변경될 때 ref 업데이트
  useEffect(() => {
    currentTimeRef.current = currentTime;
    const currentMinutes = timeToMinutes(currentTime);
    const accumulatedMinutes = accumulatedMinutesRef.current;
    
    // Only sync accumulator if change is significant (more than 1 minute difference)
    // This prevents resetting accumulator during animation when time hasn't changed by a full minute yet
    // For external changes (user interaction, prop changes), sync immediately
    if (Math.abs(currentMinutes - accumulatedMinutes) >= 1 || !playing) {
      devLog('[Timeline] Syncing accumulator from', accumulatedMinutes, 'to', currentMinutes, '(external change or not playing)');
      accumulatedMinutesRef.current = currentMinutes;
    } else {
      devLog('[Timeline] Skipping accumulator sync (animation in progress, diff:', Math.abs(currentMinutes - accumulatedMinutes), 'minutes)');
    }
  }, [currentTime, playing, timeToMinutes]);

  // Debug: Log playing state changes (development only)
  useEffect(() => {
    devLog('[Timeline] playing state changed:', { isPlaying, internalPlaying, playing });
  }, [isPlaying, internalPlaying, playing]);

  

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
    if (validatedSpeed !== speed && isDevelopment) {
      console.warn(`Play speed clamped from ${speed} to ${validatedSpeed}`);
    }
    setPlaySpeed(validatedSpeed);
  }, []);

  // Animation loop with useRef to avoid interval recreation
  useEffect(() => {
    devLog('[Timeline] useEffect animation loop - playing:', playing);
    if (!playing) {
      devLog('[Timeline] Animation not playing, skipping interval setup');
      return;
    }

    devLog('[Timeline] Setting up animation interval');
    const interval = setInterval(() => {
      devLog('[Timeline] Animation tick - current:', currentTimeRef.current);
      // Use ref to get latest values without recreating interval
      const current = accumulatedMinutesRef.current;
      const speed = playSpeedRef.current;
      const end = endMinutesRef.current;
      
      // 30fps: each frame advances by (playSpeed / 30) minutes
      // 1x speed = 1 minute per second = 1/30 per frame
      // 0.5x speed = 0.5 minutes per second = 0.5/30 per frame
      const minutesPerFrame = speed / 30;
      const next = current + minutesPerFrame;
      
      // Store previous minute value before updating ref (for comparison)
      const previousMinute = Math.floor(current);

      if (next >= end) {
        // Reached end, stop
        // If isPlaying is controlled by parent, we need to notify parent to stop
        // Otherwise, stop internal playing state
        accumulatedMinutesRef.current = end;
        if (isPlaying !== undefined && onPlayPause) {
          // Parent controls playing state, notify to stop if currently playing
          if (isPlaying) {
            onPlayPause(); // This will toggle to false
          }
        } else {
          setInternalPlaying(false);
        }
        // Always clamp to end time
        onTimeChange(endTime);
      } else {
        // Update ref first, then check if minute changed
        accumulatedMinutesRef.current = next;
        const nextMinute = Math.floor(next);
        
        // Only call onTimeChange if the minute value has actually changed
        // This prevents unnecessary state updates and useEffect triggers
        if (nextMinute !== previousMinute) {
          const nextTime = minutesToTime(next);
          devLog('[Timeline] Updating time from', currentTimeRef.current, 'to', nextTime, '(minute changed)');
          onTimeChange(nextTime);
        } else {
          devLog('[Timeline] Time update skipped (same minute, accumulated:', next.toFixed(3), 'minutes)');
        }
      }
    }, 1000 / 30); // 30fps

    return () => {
      devLog('[Timeline] Cleaning up animation interval');
      clearInterval(interval);
    };
  }, [playing, onTimeChange, onPlayPause, isPlaying, endTime, minutesToTime]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const minutes = parseInt(e.target.value);
    accumulatedMinutesRef.current = minutes;
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
    accumulatedMinutesRef.current = prev;
    onTimeChange(minutesToTime(prev));
  };

  const handleStepForward = () => {
    const current = timeToMinutes(currentTime);
    const next = Math.min(endMinutes, current + 60); // 1 hour forward
    accumulatedMinutesRef.current = next;
    onTimeChange(minutesToTime(next));
  };

  const handleReset = () => {
    onTimeChange(startTime);
    // If isPlaying is controlled by parent, notify to stop
    // Otherwise, stop internal playing state
    accumulatedMinutesRef.current = startMinutes;
    if (isPlaying !== undefined && onPlayPause) {
      // Parent controls playing state, stop if currently playing
      if (isPlaying) {
        onPlayPause(); // This will toggle to false
      }
    } else {
      setInternalPlaying(false);
    }
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

  const isSidebar = variant === 'sidebar';

  return (
    <div className={`bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 ${isSidebar ? 'p-2' : 'p-3 md:p-4'}`}>
      <div className={`${isSidebar ? 'space-y-2' : 'max-w-7xl mx-auto space-y-3 md:space-y-4'}`}>
        {/* Timeline Slider */}
        <div className={`flex items-center ${isSidebar ? 'space-x-2' : 'space-x-4'}`}>
          <span className={`font-medium text-gray-600 dark:text-gray-400 ${isSidebar ? 'text-[10px] w-10' : 'text-xs md:text-sm w-12 md:w-16'}`}>
            {startTime}
          </span>
          
          <div className="flex-1 relative">
            <input
              type="range"
              min={startMinutes}
              max={endMinutes}
              value={currentMinutes}
              onChange={handleSliderChange}
              className={`w-full ${isSidebar ? 'h-1.5' : 'h-2'} bg-gradient-to-r from-blue-900 via-yellow-400 to-orange-600 rounded-lg appearance-none cursor-pointer accent-yellow-500`}
              style={{
                background: getGradientStyle()
              }}
            />
            
            {/* Current Time Indicator */}
            <div 
              className={`absolute top-1/2 -translate-y-1/2 ${isSidebar ? 'w-3 h-3 border' : 'w-4 h-4 border-2'} bg-white dark:bg-gray-200 border-yellow-500 rounded-full shadow-lg pointer-events-none`}
              style={{
                left: getIndicatorPosition(),
                transform: 'translateX(-50%) translateY(-50%)'
              }}
            />
          </div>
          
          <span className={`font-medium text-gray-600 dark:text-gray-400 text-right ${isSidebar ? 'text-[10px] w-10' : 'text-xs md:text-sm w-12 md:w-16'}`}>
            {endTime}
          </span>
        </div>

        {/* Current Time Display */}
        <div className="text-center">
          <div className={`${isSidebar ? 'text-xl' : 'text-2xl md:text-3xl'} font-bold text-gray-900 dark:text-white`}>
            {currentTime}
          </div>
          <div className={`${isSidebar ? 'text-[11px]' : 'text-sm'} text-gray-500 dark:text-gray-400`}>
            {t('timeline.currentTime')}
          </div>
        </div>

        {/* Controls */}
        <div className={`flex items-center justify-center ${isSidebar ? 'space-x-2' : 'space-x-3 md:space-x-4'}`}>
          {/* Reset */}
          <button
            onClick={handleReset}
            className={`${isSidebar ? 'p-1' : 'p-1.5 md:p-2'} rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
            title={t('timeline.first')}
          >
            <SkipBack className={`${isSidebar ? 'w-3.5 h-3.5' : 'w-4 h-4 md:w-5 md:h-5'} text-gray-700 dark:text-gray-300`} />
          </button>

          {/* Step Backward */}
          <button
            onClick={handleStepBackward}
            className={`${isSidebar ? 'p-1' : 'p-1.5 md:p-2'} rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
            title={t('timeline.hourBack')}
          >
            <span className={`${isSidebar ? 'text-sm' : 'text-lg md:text-xl'} font-bold text-gray-700 dark:text-gray-300`}>-1h</span>
          </button>

          {/* Play/Pause */}
          <button
            type="button"
            onClick={() => {
              devLog('[Timeline] Play/Pause button click');
              handlePlayPause();
            }}
            className={`${isSidebar ? 'p-2.5' : 'p-3 md:p-4'} bg-blue-600 hover:bg-blue-700 rounded-full transition-colors`}
            title={playing ? t('timeline.pause') : t('timeline.play')}
            aria-pressed={playing}
          >
            {playing ? (
              <Pause className={`${isSidebar ? 'w-4 h-4' : 'w-5 h-5 md:w-6 md:h-6'} text-white`} fill="white" />
            ) : (
              <Play className={`${isSidebar ? 'w-4 h-4' : 'w-5 h-5 md:w-6 md:h-6'} text-white`} fill="white" />
            )}
          </button>

          {/* Step Forward */}
          <button
            onClick={handleStepForward}
            className={`${isSidebar ? 'p-1' : 'p-1.5 md:p-2'} rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
            title={t('timeline.hourForward')}
          >
            <span className={`${isSidebar ? 'text-sm' : 'text-lg md:text-xl'} font-bold text-gray-700 dark:text-gray-300`}>+1h</span>
          </button>

          {/* End */}
          <button
            onClick={() => onTimeChange(endTime)}
            className={`${isSidebar ? 'p-1' : 'p-1.5 md:p-2'} rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
            title={t('timeline.last')}
          >
            <SkipForward className={`${isSidebar ? 'w-3.5 h-3.5' : 'w-4 h-4 md:w-5 md:h-5'} text-gray-700 dark:text-gray-300`} />
          </button>
        </div>

        {/* Speed Control */}
        <div className={`flex items-center justify-center ${isSidebar ? 'space-x-1' : 'space-x-1.5 md:space-x-2'}`}>
          <span className={`${isSidebar ? 'text-[10px]' : 'text-xs'} text-gray-500 dark:text-gray-400`}>{t('timeline.playbackSpeed')}:</span>
          {[0.5, 1, 2, 5].map((speed) => (
            <button
              key={speed}
              onClick={() => setPlaySpeedSafe(speed)}
              className={`${isSidebar ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs'} rounded-full transition-colors ${
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
