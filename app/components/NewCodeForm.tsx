'use client';

import React, { useState, useEffect } from 'react';

type NewCodeFormProps = {
  onClose: () => void;
  onSubmit: (job: { id: string; title: string; type: string; mode: string; expirationDate: number }) => void;
};

const NewCodeForm = ({ onClose, onSubmit }: NewCodeFormProps) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Fixed');
  const [mode, setMode] = useState('Auto');
  const [expirationDate, setDeadline] = useState(0);

  // Function to generate a random code
  const generateRandomCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  // If mode is Auto, generate a code when component loads
  useEffect(() => {
    if (mode === 'Auto') {
      setTitle(generateRandomCode());
    }
  }, [mode]);

  const handleSubmit = () => {
    const id = `code-${Math.random().toString(36).substr(2, 9)}`;
    onSubmit({ id, title, type, mode, expirationDate });
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-yellow-200 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Discount Code</h2>

        <div className="space-y-4">
          {/* Code name */}
          <div>
            <label className="block text-sm font-medium">Code</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={mode === 'Auto'}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Enter code or auto-generated"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="Fixed">Fixed</option>
              <option value="Percentage">Percentage</option>
            </select>
          </div>

          {/* Mode */}
          <div>
            <label className="block text-sm font-medium">Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="Auto">Auto</option>
              <option value="Manual">Manual</option>
            </select>
          </div>

          {/* Expiration Date */}
          <div>
            <label className="block text-sm font-medium">Expiration Hour</label>
            <select
              value={expirationDate}
              onChange={(e) => setDeadline(Number(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4">
            <button onClick={onClose} className="text-red-500 hover:underline">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="bg-[#636255] text-white px-6 py-2 rounded-lg hover:bg-yellow-500"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewCodeForm;
