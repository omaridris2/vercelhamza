'use client';

import React, { useState } from 'react';

type NewJobFormProps = {
  
  onSubmit: (job: { id: string; orderno: string; title: string; size: string; type: string; tickId: string | null; deadline: number }) => void;
};

const NewJobForm = ({  onSubmit }: NewJobFormProps) => {
  const [orderno, setOrderno] = useState('');
  const [title, setTitle] = useState('');
  


  const [size, setSize] = useState('small');
  const [type, setType] = useState('Roland');
  const [deadline, setDeadline] = useState(0); 

  

  const handleSubmit = () => {
    const id = `cube-${Math.random().toString(36).substr(2, 9)}`;
    onSubmit({ id,orderno, title, size, type,deadline, tickId: null });
    
  };

  return (
    <div className="flex  items-center justify-center ">
      <div className=" flex-1 min-w-[240px] ">
        

        <div className="flex flex-wrap gap-10 mb-10">
          <div>
            <label className="block text-lg font-medium mb-2"></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-6 py-4 border-2 border-black rounded-lg text-lg min-w-[250px]"
              placeholder="Customer name"
            />
          </div>
          <div>
            <label className="block text-lg font-medium mb-2"></label>
            <input
              type="text"
              value={orderno}
              onChange={(e) => setOrderno(e.target.value)}
              className="w-full px-6 py-4 border-2 border-black rounded-lg text-lg min-w-[250px]"
              placeholder="Order number"
            />
          </div>
          
                    
          <div>
            <label className="block text-lg font-medium mb-2"></label>
            <select
              value={deadline}
              onChange={(e) => setDeadline(Number(e.target.value))}
              className="w-full px-6 py-4 border-2 border-black rounded-lg text-lg min-w-[250px]"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>

          

          <div>
            <label className="block text-lg font-medium mb-2"></label>
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
           <button
  onClick={handleSubmit}
  className="w-20 h-15 mt-2  border-2 border-black rounded-lg text-lg hover:bg-gray-500 flex items-center justify-center "
>
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
</button>

          

          
           
           
          
        </div>
      </div>
    </div>
  );
};

export default NewJobForm;