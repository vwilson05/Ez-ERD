'use client';

import { useCallback, useState } from 'react';
import { NodeResizer } from 'reactflow';
import { getContrastingColor } from '../utils/colorUtils';

interface DomainNodeProps {
  data: {
    label: string;
    color: string;
    opacity: number;
    onDelete?: (id: string) => void;
  };
  id: string;
  selected: boolean;
}

export default function DomainNode({ data, id, selected }: DomainNodeProps) {
  const { label, color, opacity, onDelete } = data;
  const [isHovered, setIsHovered] = useState(false);
  
  const getBorderColor = useCallback(() => {
    return {
      borderColor: color,
    };
  }, [color]);
  
  const getHeaderStyle = useCallback(() => {
    return {
      backgroundColor: `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
      color: getContrastingColor(color)
    };
  }, [color, opacity]);
  
  return (
    <>
      <div
        className={`
          min-w-[100px] min-h-[100px] rounded-lg
          ${selected ? 'border-2 border-primary-dark dark:border-primary-light' : 'border-2'}
          flex flex-col h-full w-full
          !z-[-1000] bg-transparent
        `}
        style={selected ? {} : getBorderColor()}
      >
        <NodeResizer minWidth={100} minHeight={100} isVisible={selected} />
        
        {/* Header with title and delete button */}
        <div 
          className="p-2 border-b flex justify-between items-center"
          style={!selected ? getHeaderStyle() : {}}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="font-bold truncate">{label}</div>
          
          {(isHovered || selected) && onDelete && (
            <button
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm rounded absolute top-1 right-1"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete the domain "${label}"? This cannot be undone.`)) {
                  onDelete(id);
                }
              }}
              title="Delete domain"
            >
              ✕
            </button>
          )}
        </div>
        
        {/* Completely transparent body */}
        <div className="flex-grow bg-transparent pointer-events-none"></div>
        
        {/* Transparent bottom border - clickable for resizing */}
        <div 
          className="h-2 border-t bg-transparent"
          style={!selected ? { borderColor: color } : {}}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        ></div>
      </div>
    </>
  );
} 