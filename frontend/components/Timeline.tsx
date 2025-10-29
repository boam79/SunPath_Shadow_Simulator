'use client';

import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useState, useEffect } from 'react';

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

  const playing = isPlaying !== undefined ? isPlaying : internalPlaying;

  // Convert time string to minutes
  const timeToMinutes = (time: string): number => {
    const [hoursStr, minutesStr] = time.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (isNaN(hours) || isNaN(minutes)) {
      console.error(`Invalid time format: ${time}`);
      return 0;
    }

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.error(`Time out of range: ${time}`);
      return Math.max(0, Math.min(1439, hours * 60 + minutes));
    }

    return hours * 60 + minutes;
  };

  // Convert minutes to time string
  const minutesToTime = (minutes: number): string => {
    // Round to handle fractional minutes (e.g., from 0.5x playback speed)
    const totalMinutes = Math.round(minutes);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const currentMinutes = timeToMinutes(currentTime);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  // Animation loop
  useEffect(() => {
    if (!playing) return;

    // Adjust interval time based on playSpeed to always increment by 1 minute
    // 1x speed = 1 minute per second (1000ms interval)
    // 0.5x speed = 1 minute per 2 seconds (2000ms interval)
    // 2x speed = 1 minute per 0.5 seconds (500ms interval)
    // 5x speed = 1 minute per 0.2 seconds (200ms interval)
    const intervalTime = 1000 / playSpeed;

    const interval = setInterval(() => {
      const current = timeToMinutes(currentTime);
      const next = current + 1; // Always increment by 1 minute

      if (next >= endMinutes) {
        // Reached end, stop
        setInternalPlaying(false);
        onPlayPause?.();
      } else {
        onTimeChange(minutesToTime(next));
      }
    }, intervalTime);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, currentTime, playSpeed, endMinutes]);

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
                background: `linear-gradient(to right, 
                  #1e3a8a 0%, 
                  #3b82f6 ${((6 * 60 - startMinutes) / (endMinutes - startMinutes)) * 100}%,
                  #fbbf24 ${((12 * 60 - startMinutes) / (endMinutes - startMinutes)) * 100}%,
                  #f97316 ${((18 * 60 - startMinutes) / (endMinutes - startMinutes)) * 100}%,
                  #1e3a8a 100%)`
              }}
            />
            
            {/* Current Time Indicator */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-gray-200 border-2 border-yellow-500 rounded-full shadow-lg pointer-events-none"
              style={{
                left: `${((currentMinutes - startMinutes) / (endMinutes - startMinutes)) * 100}%`,
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
              onClick={() => setPlaySpeed(speed)}
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
