'use client';

import { useCallback, useState } from 'react';
import { NodeProps, NodeResizer, Handle, Position } from 'reactflow';

interface DomainNodeProps extends NodeProps {
  data: {
    label: string;
    color: string;
    opacity: number;
    onDelete?: (nodeId: string) => void;
    comment?: string;
    tags?: string[];
    onCommentChange?: (comment: string) => void;
    onTagsChange?: (tags: string[]) => void;
  };
  selected: boolean;
}

export default function DomainNode({ id, data, selected }: DomainNodeProps) {
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [editedComment, setEditedComment] = useState(data.comment || '');
  const [editedTags, setEditedTags] = useState(data.tags?.join(', ') || '');

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
        flex flex-col h-full w-full overflow-hidden
        !z-[-1000]
      `}
      style={selected ? {} : getBorderColor()}
    >
      <NodeResizer minWidth={100} minHeight={100} isVisible={selected} />
      
      <div className="p-2 font-semibold text-center relative" style={getHeaderBackgroundStyle()}>
        {data.label}
        
        {data.onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Are you sure you want to delete domain "${data.label}"? This action cannot be undone.`)) {
                if (data.onDelete) {
                  data.onDelete(id);
                }
              }
            }}
            className="absolute right-2 top-2 text-red-500 hover:text-red-700 p-1"
            title="Delete domain"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="p-2 space-y-2">
        {isEditingComment ? (
          <input
            type="text"
            value={editedComment}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedComment(e.target.value)}
            onBlur={() => {
              setIsEditingComment(false);
              data.onCommentChange?.(editedComment);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditingComment(false);
                data.onCommentChange?.(editedComment);
              }
            }}
            placeholder="Add a comment..."
            className="w-full p-1 text-xs border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setIsEditingComment(true)}
            className="w-full text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            {data.comment || 'Add comment'}
          </button>
        )}
        <input
          type="text"
          value={editedTags}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedTags(e.target.value)}
          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
            const tags = e.target.value.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
            data.onTagsChange?.(tags);
          }}
          placeholder="Add tags (comma separated)..."
          className="w-full p-1 text-xs border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>
      
      <div className="flex-1" style={{ backgroundColor: 'transparent' }}></div>
    </div>
  );
} 