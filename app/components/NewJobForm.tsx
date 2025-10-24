'use client';

import React, { useState } from 'react';

type NewJobFormProps = {
  userId: string;
  onJobCreated?: (newJob: any) => void; // callback from parent
};

const NewJobForm = ({ userId, onJobCreated }: NewJobFormProps) => { // 👈 include onJobCreated here
  const [orderno, setOrderno] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [type, setType] = useState('Roland');
  const [deadline, setDeadline] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          orderno,
          customer_name: customerName,
          type,
          deadline,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setMessage('Order created successfully!');

        // ✅ Notify parent immediately with new order
        if (onJobCreated && result.newOrder) {
          onJobCreated({
            id: result.newOrder.id.toString(),
            tickId: null,
            title: result.newOrder.title || result.newOrder.customer_name || 'Untitled',
            orderno: result.newOrder.order_no || orderno,
            size: `Qty: ${result.newOrder.Quantity || 1}`,
            type: result.newOrder.type || type,
            completed: false,
            assignedUserId: result.newOrder.assigned_user_id || null,
            orderData: result.newOrder,
            creatorUser: result.newOrder.creator || null,
            timelineDate: null,
            customerName: result.newOrder.customer_name || customerName,
            createdAt: result.newOrder.created_at,
          });
        }

        // ✅ Reset form fields
        setOrderno('');
        setCustomerName('');
        setType('Roland');
        setDeadline('');
      } else {
        setMessage(result.error || 'Failed to create order.');
      }
    } catch {
      setMessage('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="flex-1 min-w-[240px]">
        <div className="flex flex-wrap gap-10 mb-10">
          {/* Customer name */}
          <div>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-6 py-4 border-2 border-black rounded-lg text-lg min-w-[250px]"
              placeholder="Customer name"
            />
          </div>

          {/* Order number */}
          <div>
            <input
              type="text"
              value={orderno}
              onChange={(e) => setOrderno(e.target.value)}
              className="w-full px-6 py-4 border-2 border-black rounded-lg text-lg min-w-[250px]"
              placeholder="Order number"
            />
          </div>

          {/* Deadline */}
          <div>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-6 py-4 border-2 border-black rounded-lg text-lg min-w-[250px]"
            />
          </div>

          {/* Type */}
          <div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-6 py-4 border-2 border-black rounded-lg text-lg min-w-[250px]"
            >
              <option value="Roland">Roland</option>
              <option value="Digital">Digital</option>
              <option value="Sing">Sing</option>
              <option value="Laser">Laser</option>
              <option value="Wood">Wood</option>
              <option value="Reprint">Reprint</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-20 h-15 mt-2 border-2 border-black rounded-lg text-lg hover:bg-gray-500 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <span className="text-lg">...</span>
            ) : (
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M12 2v20M2 12h20" />
              </svg>
            )}
          </button>

          {/* Message */}
          {message && (
            <div className="mt-4 text-center text-lg">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewJobForm;
