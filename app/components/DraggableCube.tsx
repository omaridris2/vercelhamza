'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';

type User = {
  id: string;
  name: string;
  email: string;
  title: string;
};

type DraggableCubeProps = {
  id: string;
  title: string;
  type: string;
  completed: boolean;
  assignedUser?: User | null;  // Make sure this is optional
  users: User[];
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onAssignUser: (cubeId: string, userId: string | null) => void;
};

const DraggableCube = ({ 
  id, 
  title, 
  type, 
  completed, 
  assignedUser, 
  users, 
  onDelete, 
  onComplete, 
  onAssignUser 
}: DraggableCubeProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ 
    id,
    disabled: completed
  });

  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setMenuPosition({ x: event.clientX, y: event.clientY });
  };
  
  const getColorClass = (type: string) => {
    if (completed) {
      return 'from-green-500 to-green-600 border-green-400';
    }
    switch (type) {
      case 'urgent':
        return 'from-red-500 to-red-600 border-red-400';
      case 'low-priority':
        return 'from-gray-400 to-gray-500 border-gray-300';
      default:
        return 'from-yellow-400 to-yellow-500 border-yellow-300';
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (title: string) => {
    switch (title) {
      case 'Admin':
        return 'bg-red-500 text-white';
      case 'Manager':
        return 'bg-green-500 text-white';
      case 'Designer':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuPosition(null);
        setShowAssignMenu(false);
      }
    };
    if (menuPosition) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [menuPosition]);

  const handleAssignUser = (userId: string | null) => {
    onAssignUser(id, userId);
    setMenuPosition(null);
    setShowAssignMenu(false);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        {...(completed ? {} : listeners)}
        {...(completed ? {} : attributes)}
        onContextMenu={handleContextMenu}
        className={`w-20 h-20 rounded-2xl shadow-lg flex flex-col justify-center items-center text-white font-bold border
            bg-gradient-to-br ${getColorClass(type)} ${completed ? 'cursor-default' : 'cursor-pointer'} relative`}
        style={{
          transform: transform && !completed
            ? `translate(${transform.x}px, ${transform.y}px)`
            : undefined,
          userSelect: 'none',
        }}
      >
        <div className="text-xs text-center px-1">{title}</div>
        
        {/* Assigned User Indicator */}
        {assignedUser && (
          <div 
            className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full text-xs flex items-center justify-center border-2 border-white ${getRoleColor(assignedUser.title)}`}
            title={`Assigned to: ${assignedUser.name} (${assignedUser.title})`}
          >
            {getUserInitials(assignedUser.name)}
          </div>
        )}
      </div>

      {menuPosition && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: menuPosition.y,
            left: menuPosition.x,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 9999,
            padding: '8px 0',
            minWidth: 200,
          }}
          onContextMenu={e => e.preventDefault()}
        >
          <div
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
            onClick={() => {
              setMenuPosition(null);
            }}
          >
            📋 View Details
          </div>

          {/* Assignment Section */}
          <div
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
            onClick={() => setShowAssignMenu(!showAssignMenu)}
          >
            👤 Assign to User {showAssignMenu ? '▲' : '▼'}
          </div>

          {showAssignMenu && (
            <div className="bg-gray-50 border-b border-gray-200">
              {/* Current Assignment */}
              {assignedUser && (
                <div className="px-6 py-2 text-sm text-gray-600 border-b border-gray-200">
                  <div className="font-medium">Currently assigned to:</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-4 h-4 rounded-full ${getRoleColor(assignedUser.title)} flex items-center justify-center text-xs`}>
                      {getUserInitials(assignedUser.name)}
                    </div>
                    <span>{assignedUser.name}</span>
                    <span className="text-xs">({assignedUser.title})</span>
                  </div>
                </div>
              )}

              {/* Unassign Option */}
              {assignedUser && (
                <div
                  className="px-6 py-2 hover:bg-gray-200 cursor-pointer text-sm text-red-600"
                  onClick={() => handleAssignUser(null)}
                >
                  ❌ Unassign
                </div>
              )}

              {/* Available Users */}
              <div className="max-h-40 overflow-y-auto">
                {users
                  .filter(user => !assignedUser || user.id !== assignedUser.id)
                  .map(user => (
                    <div
                      key={user.id}
                      className="px-6 py-2 hover:bg-gray-200 cursor-pointer text-sm flex items-center gap-2"
                      onClick={() => handleAssignUser(user.id)}
                    >
                      <div className={`w-4 h-4 rounded-full ${getRoleColor(user.title)} flex items-center justify-center text-xs`}>
                        {getUserInitials(user.name)}
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.title}</div>
                      </div>
                    </div>
                  ))}
              </div>

              {users.length === 0 && (
                <div className="px-6 py-2 text-sm text-gray-500 italic">
                  No users available
                </div>
              )}
            </div>
          )}

          {!completed && (
            <div
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
              onClick={() => {
                onComplete(id);
                setMenuPosition(null);
              }}
            >
              ✅ Mark as Complete
            </div>
          )}
          
          <div
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-600"
            onClick={() => {
              onDelete(id);
              setMenuPosition(null);
            }}
          >
            🗑️ Delete
          </div>
        </div>
      )}
    </>
  );
};

export default DraggableCube;
