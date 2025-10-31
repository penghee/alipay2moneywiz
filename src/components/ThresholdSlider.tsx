import React from 'react';
import { useThreshold } from '../contexts/ThresholdContext';

const ThresholdSlider: React.FC = () => {
  const { threshold, setThreshold, config } = useThreshold();

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="threshold" className="text-sm font-medium text-gray-700">
          支出阈值: ¥{threshold}
        </label>
        <span className="text-sm text-gray-500">
          ¥{config.min} - ¥{config.max}
        </span>
      </div>
      <input
        type="range"
        id="threshold"
        min={config.min}
        max={config.max}
        step={config.step}
        value={threshold}
        onChange={(e) => setThreshold(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>小笔支出</span>
        <span>大笔支出</span>
      </div>
    </div>
  );
};

export default ThresholdSlider;
