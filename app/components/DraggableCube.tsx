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
  orderno: number | string;  // Updated to accept both number and string
  type: string;
  completed: boolean;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  users: User[];
  onAssignUser: (cubeId: string, userId: string | null) => void;
  creatorUser: User | null; 
  assignedUser: User | null;
  
  isDragging?: boolean;
  isReadOnly?: boolean; 
  orderData?: any;
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
  
  isReadOnly,
  orderData
}: DraggableCubeProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ 
    id,
    disabled: completed
  });

  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    
    // Calculate menu dimensions (approximate)
    const menuWidth = 200;
    const menuHeight = 300; // Approximate max height
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate position, adjusting if menu would overflow
    let x = event.clientX;
    let y = event.clientY;
    
    // Flip horizontally if too close to right edge
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10;
    }
    
    // Flip vertically if too close to bottom edge
    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 10;
    }
    
    // Ensure menu doesn't go off-screen to the left or top
    x = Math.max(10, x);
    y = Math.max(10, y);
    
    setMenuPosition({ x, y });
  };
  
 const getColorClass = (type: string) => {
  // Check if deadline has passed
  if (orderData?.deadline && new Date(orderData.deadline) < new Date() && !completed) {
    return 'from-red-500 to-red-600 border-red-600';
  }

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

  // Order Details Modal Component
  const OrderDetailsModal = () => {
    if (!showOrderModal || !orderData) return null;

    const orderItem = orderData.order_items?.[0];
    const product = orderItem?.products;
    const options = orderItem?.order_item_options || [];

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]"
        onClick={() => setShowOrderModal(false)}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
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
                  <div className="  text-gray-200 text-sm mt-1">
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

          {/* Content */}
          <div className="p-6 space-y-6">
            
            {/* Order Summary */}
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

            {/* Product Information */}
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

            {/* Configuration Options */}
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
            

            
                
            {/* Price Breakdown */}
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

          {/* Footer */}
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
      </div>
    );
  };

  return (
    <>
      {/* Order Details Modal */}
      <OrderDetailsModal />

      <div
        ref={setNodeRef}
        {...(completed ? {} : listeners)}
        {...(completed ? {} : attributes)}
        onContextMenu={handleContextMenu}
        className={`w-40 h-40 rounded-2xl shadow-lg flex flex-col justify-center items-center text-white font-bold border-2 bg-[#636255]
            border-gradient-to-br ${getColorClass(type)} ${completed ? 'cursor-default' : 'cursor-pointer'} relative
            ${isDragging ? 'opacity-100' : 'opacity-100'}`}
        style={{
          transform: transform && !completed
            ? `translate(${transform.x}px, ${transform.y}px)`
            : undefined,
          userSelect: 'none',
        }}
      >
        <div className="text-center px-2">
          <div className="text-lg font-bold truncate" title={orderData?.customer_name || title}>
            {orderData?.customer_name || title}
          </div>
          <div className="text-lg font-bold truncate">
            #{orderno}
          </div>
          <div className="text-lg font-bold truncate">
            {type}
          </div>
        </div>
        
        {completed && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
        
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
            {/* View Order Details */}
            {orderData && (
              <div
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                onClick={() => {
                  setShowOrderModal(true);
                  setMenuPosition(null);
                }}
              >
                📋 View Order Details
              </div>
            )}

            {/* Assignment Section */}
            {!isReadOnly  && ( <div
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
              onClick={() => setShowAssignMenu(!showAssignMenu)}
            >
              👤 Assign to User {showAssignMenu ? '▲' : '▼'}
            </div> )}
            

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
                    ❌ Unassign
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

            {!isReadOnly &&!completed && (
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
            {!isReadOnly && (
            <div
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-600"
              onClick={() => {
                onDelete(id);
                setMenuPosition(null);
              }}
            >
              🗑️ Delete
            </div>)}
          </div>,
          document.body
        )}
    </>
  );
};

export default DraggableCube;