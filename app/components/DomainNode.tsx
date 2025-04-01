'use client';

import { useCallback } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';

interface DomainNodeProps extends NodeProps {
  data: {
    label: string;
    color: string;
    opacity: number;
  };
  selected: boolean;
}

export default function DomainNode({ id, data, selected }: DomainNodeProps) {
  // Get a lighter version of the color for the header background
  const getHeaderBackgroundStyle = useCallback(() => {
    return {
      backgroundColor: data.color,
      opacity: data.opacity || 0.3
    };
  }, [data.color, data.opacity]);

  // Border color with appropriate opacity
  const getBorderColor = useCallback(() => {
    return {
      borderColor: data.color
    };
  }, [data.color]);

  return (
    <div
      className={`
        min-w-[100px] min-h-[100px] rounded-lg
        ${selected ? 'border-2 border-primary-dark dark:border-primary-light' : 'border-2'}
        flex flex-col overflow-hidden
      `}
      style={selected ? {} : getBorderColor()}
    >
      <NodeResizer minWidth={100} minHeight={100} isVisible={selected} />
      
      <div className="p-2 font-semibold text-center" style={getHeaderBackgroundStyle()}>
        {data.label}
      </div>
      
      <div className="flex-1" style={{ backgroundColor: 'transparent' }}></div>
    </div>
  );
} 