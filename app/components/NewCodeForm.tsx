'use client';

import React, { useState, useEffect } from 'react';
import { createDiscountCode } from '@/app/actions/discountActions';

type NewCodeFormProps = {
  onClose: () => void;
};

const NewCodeForm = ({ onClose }: NewCodeFormProps) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'Fixed' | 'Percentage'>('Fixed');
  const [mode, setMode] = useState<'Auto' | 'Manual'>('Auto');
  const [amount, setAmount] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [useLimit, setUseLimit] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate random code
  const generateRandomCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  // Auto-generate when mode = Auto
  useEffect(() => {
    if (mode === 'Auto') {
      setTitle(generateRandomCode());
    } else {
      setTitle('');
    }
  }, [mode]);

  // Get today’s date in YYYY-MM-DD
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const handleSubmit = async () => {
    if (!title || !amount || !expirationDate || !useLimit) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    const newCode = {
      id: `code-${Math.random().toString(36).substr(2, 9)}`,
      code: title.trim().toUpperCase(),
      type,
      mode,
      amount: Number(amount),
      expiration_date: expirationDate,
      use_limit: Number(useLimit),
    };

    try {
      await createDiscountCode(newCode);
      alert('Discount code created successfully!');
      onClose();
    } catch (err: any) {
      if (err.message.includes('exists') || err.message.includes('duplicate')) {
        alert('⚠️ This code already exists. Try another one.');
      } else {
        alert('❌ Failed to create code: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-yellow-200 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Discount Code</h2>

        <div className="space-y-5">
          {/* Mode */}
          <div>
            
          </div>

          {/* Code name */}
          <div>
            <label className="block text-sm font-medium "></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.toUpperCase())}
              disabled={mode === 'Auto'}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="Enter code or auto-generated"
            />
          </div>
          
            <div className="flex gap-2">
              <button
                onClick={() => setMode('Manual')}
                className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                  mode === 'Manual'
                    ? 'bg-yellow-400 text-white'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Manual
              </button>
              <button
                onClick={() => setMode('Auto')}
                className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                  mode === 'Auto'
                    ? 'bg-yellow-400 text-white'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Auto
              </button>
            </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setType('Fixed')}
                className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                  type === 'Fixed'
                    ? 'bg-yellow-400 text-white'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Fixed
              </button>
              <button
                onClick={() => setType('Percentage')}
                className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                  type === 'Percentage'
                    ? 'bg-yellow-400 text-white'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                Percentage
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {type === 'Fixed' ? 'Amount ($) *' : 'Percentage (%) *'}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              max={type === 'Percentage' ? '100' : undefined}
              step={type === 'Fixed' ? '0.01' : '1'}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder={type === 'Fixed' ? 'Enter amount' : 'Enter percentage'}
            />
          </div>

          {/* Use Limit */}
          <div>
            <label className="block text-sm font-medium mb-2">Usage Limit *</label>
            <input
              type="number"
              value={useLimit}
              onChange={(e) => setUseLimit(e.target.value)}
              min="1"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              placeholder="Maximum number of uses"
            />
          </div>

          {/* Expiration Date */}
          <div>
            <label className="block text-sm font-medium mb-2">Expiration Date *</label>
            <input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              min={getTodayDate()}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              onClick={onClose}
              className="text-red-500 hover:text-red-700 font-medium transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${
                loading ? 'bg-gray-400' : 'bg-[#636255] hover:bg-yellow-500'
              }`}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewCodeForm;
