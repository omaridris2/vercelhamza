'use client';

import React, { useState } from 'react';

type NewJobFormProps = {
  onClose: () => void;
  onSubmit: (job: { id: string; title: string; size: string; type: string; tickId: string | null;deadline: number }) => void;
};

const NewJobForm = ({ onClose, onSubmit }: NewJobFormProps) => {
  const [title, setTitle] = useState('');
  const [size, setSize] = useState('small');
  const [type, setType] = useState('default');
  const [deadline, setDeadline] = useState(0); 

  

  const handleSubmit = () => {
    const id = `cube-${Math.random().toString(36).substr(2, 9)}`;
    onSubmit({ id, title, size, type,deadline, tickId: null });
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-yellow-200 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Job</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Job Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="e.g. Design Review"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Size</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="default">Default</option>
              <option value="urgent">Urgent</option>
              <option value="low-priority">Low Priority</option>
            </select>
          </div>

          <div>
  <label className="block text-sm font-medium">Deadline (Hour)</label>
  <select
    value={deadline}
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

          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="text-red-500 hover:underline"
            >
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

export default NewJobForm;
