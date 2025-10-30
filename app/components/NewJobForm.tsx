'use client';

import React, { useState } from 'react';

type NewJobFormProps = {
  userId: string;
  onJobCreated?: (newJob: any) => void; 
};

const NewJobForm = ({ userId, onJobCreated }: NewJobFormProps) => { 
  const [orderno, setOrderno] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [type, setType] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedHour, setSelectedHour] = useState<string>('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!type) {
      setMessage('Please select a type before submitting.');
      return;
    }

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
          deadline: selectedDate && selectedHour ? `${selectedDate}T${selectedHour}:00` : '',
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setMessage('Order created successfully!');

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

        // reset
        setOrderno('');
        setCustomerName('');
        setType('');
        setSelectedDate('');
        setSelectedHour('');
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
          
          <div>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-6 py-4 border-2 border-black rounded-lg text-lg min-w-[250px]"
              placeholder="Customer name"
            />
          </div>

          <div>
            <input
              type="text"
              value={orderno}
              onChange={(e) => setOrderno(e.target.value)}
              pattern="[0-9]*"
              inputMode="numeric"
              className="w-full px-6 py-4 border-2 border-black rounded-lg text-lg min-w-[250px]"
              placeholder="Order number"
            />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="w-full px-6 py-4 border-2 border-black rounded-lg text-lg min-w-[250px] text-left"
            >
              {selectedDate && selectedHour 
                ? `${new Date(selectedDate).toLocaleDateString()} - ${selectedHour}:00`
                : "Select Deadline"}
            </button>
            
            {isDatePickerOpen && (
              <div className="absolute z-50 mt-2 w-full bg-white border-2 border-black rounded-lg shadow-lg">
                <div className="p-4">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full mb-4 px-4 py-2 border-2 border-black rounded-lg"
                  />
                  <div className="grid grid-cols-6 gap-2">
                    {Array.from({ length: 24 }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSelectedHour(i.toString().padStart(2, '0'));
                          setIsDatePickerOpen(false);
                        }}
                        className={`px-2 py-2 border rounded-lg text-center ${
                          selectedHour === i.toString().padStart(2, '0')
                            ? 'bg-[#636255] text-white'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <span className="inline-block w-full text-center">
                          {i.toString().padStart(2, '0')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-6 py-4 border-2 border-black rounded-lg text-lg min-w-[250px]"
            >
              <option value="" disabled>
                Pick a Type
              </option>
              <option value="Roland">Roland</option>
              <option value="Digital">Digital</option>
              <option value="Sign">Sign</option>
              <option value="Laser">Laser</option>
              <option value="Wood">Wood</option>
              <option value="Reprint">Reprint</option>
              <option value="UV">UV</option>
            </select>
          </div>

          <button
            onClick={handleSubmit}
            className="w-20 h-15 border-2 border-black rounded-lg text-lg hover:bg-gray-500 flex items-center justify-center"
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
        </div>
        {message && (
          <div className="mt-4 text-center text-lg mb-5">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewJobForm;