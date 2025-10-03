'use client';

import React from 'react';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: any;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, orderData }) => {
  if (!isOpen || !orderData) return null;

  const orderItem = orderData.order_items?.[0];
  const product = orderItem?.products;
  const options = orderItem?.order_item_options || [];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#636255] text-white p-6 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Order Details</h2>
            <p className="text-gray-200 text-sm mt-1">Order #{orderData.id}</p>
          </div>
          <button 
            onClick={onClose}
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
              <div>
                <span className="text-sm text-gray-600">Order Date</span>
                <p className="font-medium text-gray-900">{new Date(orderData.created_at).toLocaleDateString()}</p>
              </div>
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
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            className="px-6 py-2 bg-[#636255] hover:bg-yellow-500 text-white font-medium rounded-lg transition-colors"
          >
            Print Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;