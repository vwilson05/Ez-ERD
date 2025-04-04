'use client';

import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';

export default function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style = {},
}: EdgeProps) {
  // Calculate the path for the edge
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Set relationshipType to one-to-many by default
  const relationshipType = data?.relationshipType || 'one-to-many';

  // Calculate angle for marker rotation
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Check for dark mode
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const strokeColor = isDarkMode ? '#ffffff' : '#000000';

  // Create visible cardinality markers based on relationship type
  // These will be visible even in exports
  const getCardinalityMarkers = () => {
    switch (relationshipType) {
      case 'one-to-one':
        return {
          source: (
            <g transform={`translate(${sourceX}, ${sourceY}) rotate(${angle})`}>
              <line 
                x1="-10" 
                y1="-8" 
                x2="-10" 
                y2="8" 
                stroke={strokeColor}
                strokeWidth="2" 
              />
            </g>
          ),
          target: (
            <g transform={`translate(${targetX}, ${targetY}) rotate(${angle + 180})`}>
              <line 
                x1="-10" 
                y1="-8" 
                x2="-10" 
                y2="8" 
                stroke={strokeColor}
                strokeWidth="2" 
              />
            </g>
          ),
          label: '1:1'
        };
      
      case 'one-to-many':
        return {
          source: (
            <g transform={`translate(${sourceX}, ${sourceY}) rotate(${angle})`}>
              <line 
                x1="-10" 
                y1="-8" 
                x2="-10" 
                y2="8" 
                stroke={strokeColor}
                strokeWidth="2" 
              />
            </g>
          ),
          target: (
            <g transform={`translate(${targetX}, ${targetY}) rotate(${angle + 180})`}>
              <path 
                d="M -14 -8 L -6 0 L -14 8" 
                fill="none" 
                stroke={strokeColor} 
                strokeWidth="2" 
              />
              <path 
                d="M -20 -8 L -12 0 L -20 8" 
                fill="none" 
                stroke={strokeColor}
                strokeWidth="2"
              />
            </g>
          ),
          label: '1:N'
        };
      
      case 'many-to-many':
        return {
          source: (
            <g transform={`translate(${sourceX}, ${sourceY}) rotate(${angle})`}>
              <path 
                d="M -14 -8 L -6 0 L -14 8" 
                fill="none" 
                stroke={strokeColor}
                strokeWidth="2"
              />
              <path 
                d="M -20 -8 L -12 0 L -20 8" 
                fill="none" 
                stroke={strokeColor}
                strokeWidth="2"
              />
            </g>
          ),
          target: (
            <g transform={`translate(${targetX}, ${targetY}) rotate(${angle + 180})`}>
              <path 
                d="M -14 -8 L -6 0 L -14 8" 
                fill="none" 
                stroke={strokeColor}
                strokeWidth="2"
              />
              <path 
                d="M -20 -8 L -12 0 L -20 8" 
                fill="none" 
                stroke={strokeColor}
                strokeWidth="2"
              />
            </g>
          ),
          label: 'N:N'
        };
      
      default:
        return {
          source: null,
          target: null,
          label: ''
        };
    }
  };

  const { source, target, label } = getCardinalityMarkers();
  const bgColor = isDarkMode ? '#1f2937' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#000000';

  // Simple styling with solid colors and no effects
  return (
    <>
      <path
        id={id}
        d={edgePath}
        stroke={strokeColor}
        strokeWidth={1.5}
        fill="none"
        style={{ 
          strokeDasharray: relationshipType === 'many-to-many' ? "5,5" : "none" 
        }}
      />
      
      {/* Cardinality markers */}
      {source}
      {target}
      
      {/* Render edge label */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 10,
            fontWeight: 'bold',
            pointerEvents: 'all',
            padding: '2px 4px',
            borderRadius: '4px',
            backgroundColor: bgColor,
            color: textColor,
            border: `1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'}`,
          }}
          className="nodrag nopan"
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
} 