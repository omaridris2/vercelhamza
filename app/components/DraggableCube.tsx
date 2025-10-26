'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import ReactDOM from 'react-dom';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
};

interface DraggableCubeProps {
  id: string;
  title: string;
  orderno: number | string;
  type: string;
  completed: boolean;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  users: User[];
  onAssignUser: (cubeId: string, userId: string | null) => void;
  creatorUser: User | null; 
  assignedUser: User | null;
  onMoveToQueue: (id: string) => void;
  isDragging?: boolean;
  isReadOnly?: boolean; 
  orderData?: any;
  isMissed?: boolean;
  isReprint?: boolean;
  onMarkAsReprint?: (id: string) => void;
  onMarkAsPrint?: (id: string) => void;
  onMarkAsLamination?: (id: string) => void;
  onMarkAsCut?: (id: string) => void;
  onMarkAsFinishing?: (id: string) => void;
  onMarkAsInstallation?: (id: string) => void;
}

const DraggableCube = ({ 
  id, 
  title,
  orderno,
  type, 
  completed, 
  creatorUser,
  assignedUser, 
  users, 
  onDelete, 
  onComplete, 
  onAssignUser,
  isDragging,
  onMoveToQueue,
  isMissed = false,
  isReprint = false,
  onMarkAsReprint,
  onMarkAsPrint,
  onMarkAsLamination,
  onMarkAsCut,
  onMarkAsFinishing,
  onMarkAsInstallation,
  isReadOnly,
  orderData
}: DraggableCubeProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showStageMenu, setShowStageMenu] = useState(false);
  
  // Check if deadline has passed (but ignore if reprint)
  const isPastDeadline = !isReprint && orderData?.deadline 
    ? new Date(orderData.deadline).getTime() < new Date().getTime()
    : false;

  // ✅ Reprint tasks can ALWAYS be dragged (unless read-only or menu is open)
  // Reprint status overrides completed, missed, and deadline checks
  const disabled = isReprint 
    ? (isReadOnly || menuOpen)  // Reprint: only disabled if read-only or menu open
    : (completed || isReadOnly || isMissed || isPastDeadline || menuOpen);  // Non-reprint: normal rules
  
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ 
    id,
    disabled
  });

  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);

  // Combined ref for both dnd-kit and our local reference
  const combinedRef = (node: HTMLDivElement | null) => {
    cubeRef.current = node;
    setNodeRef(node);
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const menuWidth = 200;
    const menuHeight = 300;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let x = event.clientX;
    let y = event.clientY;
    
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10;
    }
    
    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 10;
    }
    
    x = Math.max(10, x);
    y = Math.max(10, y);
    
    setMenuPosition({ x, y });
    setMenuOpen(true);
  };
  
  const getColorClass = (type: string) => {
    // Reprint takes highest priority (gray)
    if (isReprint) {
      return 'from-gray-400 to-gray-500 border-gray-600';
    }

    // Completed (green)
    if (completed) {
      return 'from-green-500 to-green-600 border-green-400';
    }

    // Missed takes next priority (red)
    if (isMissed) {
      return 'from-red-500 to-red-600 border-red-600';
    }

    // Deadline-based coloring
    if (orderData?.deadline) {
      const now = new Date();
      const deadline = new Date(orderData.deadline);
      const timeUntilDeadline = deadline.getTime() - now.getTime();
      const oneHourInMs = 60 * 60 * 1000;

      if (timeUntilDeadline < 0) {
        return 'from-gray-400 to-gray-500 border-gray-600';
      }

      if (timeUntilDeadline <= oneHourInMs) {
        return 'from-red-500 to-red-600 border-red-600';
      }
    }

    // Type-based coloring
    switch (type) {
      case 'urgent':
        return 'from-red-500 to-red-600 border-red-400';
      case 'low-priority':
        return 'from-gray-400 to-gray-500 border-gray-300';
      default:
        return 'from-yellow-400 to-yellow-500 border-yellow-300';
    }
  };

  const getUserInitials = (name: string | null) => {
    if (!name) return 'U';
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

  // Improved click outside handler
  useEffect(() => {
    const handleInteractionOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (
        menuRef.current && !menuRef.current.contains(target) &&
        cubeRef.current && !cubeRef.current.contains(target)
      ) {
        setMenuPosition(null);
        setShowAssignMenu(false);
        setShowStageMenu(false);
        setMenuOpen(false);
      }
    };

    if (menuPosition) {
      document.addEventListener('mousedown', handleInteractionOutside);
      document.addEventListener('touchstart', handleInteractionOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleInteractionOutside);
      document.removeEventListener('touchstart', handleInteractionOutside);
    };
  }, [menuPosition]);

  const handleAssignUser = (userId: string | null) => {
    onAssignUser(id, userId);
    setMenuPosition(null);
    setShowAssignMenu(false);
    setMenuOpen(false);
  };

  const OrderDetailsModal = () => {
    if (!showOrderModal || !orderData) return null;

    const orderItem = orderData.order_items?.[0];
    const product = orderItem?.products;
    const options = orderItem?.order_item_options || [];

    return ReactDOM.createPortal(
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]"
        onClick={() => setShowOrderModal(false)}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-[#636255] text-white p-6 rounded-t-2xl flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Order Details</h2>
              <p className="text-gray-200 text-sm mt-1">
                Order #{orderData.order_no || orderData.id}
              </p>
              {orderData.customer_name && (
                <p className="text-gray-200 text-sm mt-1">
                  Customer: {orderData?.customer_name || title}
                </p>
              )}
              {creatorUser && (
                <div className="text-gray-200 text-sm mt-1">
                  Created by: <span className="font-medium">{creatorUser.name}</span> ({creatorUser.role})
                </div>
              )}
            </div>
            <button 
              onClick={() => setShowOrderModal(false)}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-10 h-10 flex items-center justify-center text-2xl transition-colors"
            >
              ×
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3 text-gray-900">Order Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                {orderData.order_no && (
                  <div>
                    <span className="text-sm text-gray-600">Order Number</span>
                    <p className="font-medium text-gray-900">{orderData.order_no}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-600">Status</span>
                  <p className="font-medium text-gray-900 capitalize">{orderData.status}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Quantity</span>
                  <p className="font-medium text-gray-900">{orderData.Quantity}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Total Price</span>
                  <p className="font-bold text-xl text-green-600">${Number(orderData.price).toFixed(2)}</p>
                </div>
                {orderData.deadline && (
                  <div>
                    <span className="text-sm text-gray-600">Deadline</span>
                    <p className="font-medium text-red-600">
                      {new Date(orderData.deadline).toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-600">Order Date</span>
                  <p className="font-medium text-gray-900">{new Date(orderData.created_at).toLocaleDateString()}</p>
                </div>
                {orderData.updated_at && (
                  <div>
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <p className="font-medium text-gray-900">{new Date(orderData.updated_at).toLocaleDateString()}</p>
                  </div>
                )}
                {orderData.completed_at && (
                  <div className="col-span-2">
                    <span className="text-sm text-gray-600">Completed At</span>
                    <p className="font-medium text-green-700">
                      {new Date(orderData.completed_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {product && (
              <div className="border-t pt-6">
                <h3 className="font-semibold text-lg mb-4 text-gray-900">Product Information</h3>
                <div className="flex items-start gap-4">
                  {product.image_url && (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-bold text-xl text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">Product ID: {product.id}</p>
                    {product.type && (
                      <p className="text-sm text-gray-600">Type: {product.type}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {options.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="font-semibold text-lg mb-4 text-gray-900">Configuration</h3>
                <div className="space-y-3">
                  {options.map((option: any, idx: number) => {
                    const menuOption = option.product_menu_options;
                    const menuName = menuOption?.product_menus?.name || 'Option';
                    const optionName = menuOption?.option_name || 'N/A';
                    const optionPrice = menuOption?.price || 0;
                    
                    return (
                      <div 
                        key={idx} 
                        className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:border-[#636255] transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{menuName}</p>
                          <p className="text-gray-600">{optionName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-600 font-bold text-lg">+${Number(optionPrice).toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {options.length === 0 && (
              <div className="border-t pt-6">
                <p className="text-gray-500 italic text-center">No configuration options selected</p>
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-4 text-gray-900">Price Breakdown</h3>
              <div className="space-y-2">
                {options.map((option: any, idx: number) => {
                  const menuOption = option.product_menu_options;
                  const optionName = menuOption?.option_name || 'Option';
                  const optionPrice = menuOption?.price || 0;
                  
                  return (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-600">{optionName}</span>
                      <span className="text-gray-900 font-medium">${Number(optionPrice).toFixed(2)}</span>
                    </div>
                  );
                })}
                <div className="flex justify-between text-sm border-t pt-2 mt-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900 font-medium">${Number(orderData.price / orderData.Quantity).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Quantity</span>
                  <span className="text-gray-900 font-medium">× {orderData.Quantity}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t-2 pt-3 mt-3">
                  <span className="text-gray-900">Total</span>
                  <span className="text-green-600">${Number(orderData.price).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-b-2xl flex justify-end gap-3">
            <button
              onClick={() => setShowOrderModal(false)}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              className="px-6 py-2 bg-[#636255] hover:bg-yellow-500 text-white font-medium rounded-lg transition-colors"
              onClick={() => window.print()}
            >
              Print Order
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <OrderDetailsModal />

      <div
        ref={combinedRef}
        {...(disabled ? {} : listeners)}
        {...(disabled ? {} : attributes)}
        onContextMenu={handleContextMenu}
        className={`w-40 h-40 rounded-2xl shadow-lg flex flex-col justify-center items-center text-white font-bold border-2 bg-[#636255]
          border-gradient-to-br ${getColorClass(type)} ${disabled ? 'cursor-default' : 'cursor-pointer'} relative
          ${isDragging ? 'opacity-100' : 'opacity-100'}`}
        style={{
          transform: transform && !disabled
            ? `translate(${transform.x}px, ${transform.y}px)`
            : undefined,
          userSelect: 'none',
        }}
      >
        {/* Status indicator circle at top-right inside */}
        <div 
          className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 border-gradient-to-br ${getColorClass(type)}`}
          style={{
            backgroundColor: isReprint
              ? 'rgb(156, 163, 175)' // gray-400 for reprint
              : completed 
                ? 'rgb(34, 197, 94)' // green-500
                : isMissed
                  ? 'rgb(239, 68, 68)' // red-500 for missed
                  : isPastDeadline 
                    ? 'rgb(156, 163, 175)' // gray-400
                    : orderData?.deadline && new Date(orderData.deadline).getTime() - new Date().getTime() <= 60 * 60 * 1000
                      ? 'rgb(239, 68, 68)' // red-500
                      : type === 'urgent'
                        ? 'rgb(239, 68, 68)' // red-500
                        : type === 'low-priority'
                          ? 'rgb(156, 163, 175)' // gray-400
                          : 'rgb(250, 204, 21)' // yellow-400
          }}
        />
        
        <div className="text-center px-2">
          <div className="text-lg font-bold truncate" title={orderData?.customer_name || title}>
            {orderData?.customer_name || title}
          </div>
          <div className="text-lg font-bold truncate">
            #{orderno}
          </div>
          <div className="text-sm font-semibold truncate">
            {orderData?.deadline 
              ? new Date(orderData.deadline).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : type}
          </div>
        </div>
        
        {assignedUser && (
          <div 
            className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full text-xs flex items-center justify-center border-2 border-white ${getRoleColor(assignedUser.role)}`}
            title={`Assigned to: ${assignedUser.name || 'Unknown'} (${assignedUser.role || 'No role'})`}
          >
            {getUserInitials(assignedUser.name)}
          </div>
        )}
      </div>

     {menuPosition &&
  ReactDOM.createPortal(
    <div
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: menuPosition.y + window.scrollY,
        left: menuPosition.x + window.scrollX,
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
      {orderData && (
        <div
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
          onClick={() => {
            setShowOrderModal(true);
            setMenuPosition(null);
            setMenuOpen(false);
          }}
        >
          View Order Details
        </div>
      )}

      {!isReadOnly && (
        <div
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
          onClick={() => setShowAssignMenu(!showAssignMenu)}
        >
          Assign to User {showAssignMenu ? '▲' : '▼'}
        </div>
      )}

      {showAssignMenu && (
        <div className="bg-gray-50 border-b border-gray-200">
          {assignedUser && (
            <div className="px-6 py-2 text-sm text-gray-600 border-b border-gray-200">
              <div className="font-medium">Currently assigned to:</div>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-4 h-4 rounded-full ${getRoleColor(assignedUser.role)} flex items-center justify-center text-xs`}>
                  {getUserInitials(assignedUser.name)}
                </div>
                <span>{assignedUser.name || 'Unknown'}</span>
                <span className="text-xs">({assignedUser.role || 'No role'})</span>
              </div>
            </div>
          )}

          {assignedUser && (
            <div
              className="px-6 py-2 hover:bg-gray-200 cursor-pointer text-sm text-red-600"
              onClick={() => handleAssignUser(null)}
            >
              Unassign
            </div>
          )}

          <div className="max-h-40 overflow-y-auto">
            {users
              .filter(user => !assignedUser || user.id !== assignedUser.id)
              .map(user => (
                <div
                  key={user.id}
                  className="px-6 py-2 hover:bg-gray-200 cursor-pointer text-sm flex items-center gap-2"
                  onClick={() => handleAssignUser(user.id)}
                >
                  <div className={`w-4 h-4 rounded-full ${getRoleColor(user.role)} flex items-center justify-center text-xs`}>
                    {getUserInitials(user.name)}
                  </div>
                  <div>
                    <div className="font-medium">{user.name || 'Unknown User'}</div>
                    <div className="text-xs text-gray-500">{user.role || 'No role'}</div>
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

      {/* Move to Stage submenu */}
      {(onMarkAsPrint || onMarkAsLamination || onMarkAsCut || onMarkAsFinishing || onMarkAsInstallation) && (
        <div className="relative">
          <div
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200 flex justify-between items-center"
            onClick={() => setShowStageMenu(!showStageMenu)}
            onMouseEnter={() => setShowStageMenu(true)}
          >
            <span>Update Status to</span>
            
          </div>

          {showStageMenu && (
            <div
              className="absolute left-full top-0 bg-white border border-gray-300 rounded-lg shadow-lg min-w-[180px] ml-1"
              style={{ zIndex: 10000 }}
              onMouseLeave={() => setShowStageMenu(false)}
            >
              {onMarkAsPrint && (
                <div
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer first:rounded-t-lg"
                  onClick={() => {
                    onMarkAsPrint(id);
                    setMenuPosition(null);
                    setMenuOpen(false);
                    setShowStageMenu(false);
                  }}
                >
                   Printing
                </div>
              )}

              {onMarkAsLamination && (
                <div
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    onMarkAsLamination(id);
                    setMenuPosition(null);
                    setMenuOpen(false);
                    setShowStageMenu(false);
                  }}
                >
                   Lamination
                </div>
              )}

              {onMarkAsCut && (
                <div
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    onMarkAsCut(id);
                    setMenuPosition(null);
                    setMenuOpen(false);
                    setShowStageMenu(false);
                  }}
                >
                   Cutting
                </div>
              )}

              {onMarkAsFinishing && (
                <div
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    onMarkAsFinishing(id);
                    setMenuPosition(null);
                    setMenuOpen(false);
                    setShowStageMenu(false);
                  }}
                >
                  Finishing
                </div>
              )}

              {onMarkAsInstallation && (
                <div
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer last:rounded-b-lg"
                  onClick={() => {
                    onMarkAsInstallation(id);
                    setMenuPosition(null);
                    setMenuOpen(false);
                    setShowStageMenu(false);
                  }}
                >
                  Installation
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!isReadOnly && !completed && (
        <div
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
          onClick={() => {
            onComplete(id);
            setMenuPosition(null);
            setMenuOpen(false);
          }}
        >
         Mark as Complete
        </div>
      )}

      {!isReadOnly && !isReprint && (
        <div
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
          onClick={() => {
            onMoveToQueue(id);
            setMenuPosition(null);
            setMenuOpen(false);
          }}
        >
           Move to Queue
        </div>
      )}

      {!isReadOnly && !isReprint && onMarkAsReprint && (
        <div
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
          onClick={() => {
            onMarkAsReprint(id);
            setMenuPosition(null);
            setMenuOpen(false);
          }}
        >
          Mark as Reprint
        </div>
      )}

      {!isReadOnly && (
        <div
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-600"
          onClick={() => {
            onDelete(id);
            setMenuPosition(null);
            setMenuOpen(false);
          }}
        >
          Delete
        </div>
      )}
    </div>,
    document.body
  )}
    </>
  );
};

export default DraggableCube;