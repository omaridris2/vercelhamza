import React, { useState, useRef, useEffect, useCallback } from 'react' // Added useCallback
import { DndContext, closestCorners, DragEndEvent } from '@dnd-kit/core';
import DraggableCube from './DraggableCube';
import DroppableTick from './DroppableTick';
import NewJobForm from './NewJobForm';
import { fetchOrders, updateOrderPosition, updateOrderStatus, assignOrderToUser } from '@/app/actions/orderActions';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
};

interface UserTableProps {
  users: User[];
  assignedUsers: { [key: string]: string | null };
  onAssignUser: (cubeId: string, userId: string | null) => void;
  loading?: boolean;
}

type CubeType = "Roland" | "Digital" | "Sing" | "Laser" | "Wood" | "Reprint";

const CUBE_TYPES: CubeType[] = ["Roland", "Digital", "Sing", "Laser", "Wood", "Reprint"];

const Timeline: React.FC<UserTableProps> = ({ users, loading }) => {
  const [activeTab, setActiveTab] = useState<'task creation' | 'user management' | 'task tracking'>('task creation');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [activeFilters, setActiveFilters] = useState<CubeType[]>([]);
  const [showAllTypes, setShowAllTypes] = useState(true);
  
  // Date navigation state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false); // Kept for the custom dropdown functionality

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      if (direction === "left") {
        scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  const TICKS = Array.from({ length: 24 });
  
  const [cubes, setCubes] = useState<{
    id: string;
    tickId: string | null;
    title: string;
    orderno: string;
    size: string;
    type: string;
    completed: boolean;
    assignedUserId?: string | null;
    orderData?: any;
    timelineDate?: string | null; // Added to match loadOrders logic
  }[]>([]);

  const [assignedUsers, setAssignedUsers] = useState<{[key: string]: string | null}>({});
  const [showMenu, setShowMenu] = useState(false);

  // Helper functions for Date logic
  const formatDateForDB = useCallback((date: Date) => {
    return date.toISOString().split('T')[0];
  }, []);

  const formatDateForInput = useCallback((date: Date) => {
    // Ensures the format is YYYY-MM-DD for the native input
    return date.toISOString().split('T')[0];
  }, []);

  const formatDisplayDate = useCallback((date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  }, []);

  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, []);
  // End Helper functions

  const loadOrders = useCallback(async () => {
    console.log('Loading orders for date:', formatDateForDB(selectedDate));

    // Fetch ALL orders (not just for selected date)
    const result = await fetchOrders();

    if (result.success && result.orders && result.orders.length > 0) {
      const allOrderCubes = result.orders.map((order: any) => {
        const orderItem = order.order_items?.[0];
        const product = orderItem?.products;

        return {
          id: order.id.toString(),
          tickId: order.timeline_position || null,
          title: product?.name || 'Order',
          orderno: order.id.toString(),
          size: `Qty: ${order.Quantity || 1}`,
          type: order.type || 'Roland',
          completed: order.status === 'completed',
          assignedUserId: order.assigned_user_id,
          timelineDate: order.timeline_date || null, // ✅ track which date it's placed on
          orderData: order,
        };
      });

      // ✅ Filter logic: show unplaced + today's placed tasks
      const visibleCubes = allOrderCubes.filter(
        (cube: any) =>
          cube.tickId === null || // Always keep unplaced
          cube.timelineDate === formatDateForDB(selectedDate) // Show placed for current date
      );

      setCubes(visibleCubes);

      // Assign users
      const assignments: { [key: string]: string | null } = {};
      visibleCubes.forEach((cube: any) => {
        if (cube.assignedUserId) {
          assignments[cube.id] = cube.assignedUserId;
        }
      });
      setAssignedUsers(assignments);
    } else {
      setCubes([]);
      setAssignedUsers({});
    }
  }, [formatDateForDB, selectedDate]); // Dependencies for useCallback

  // Fetch orders when component mounts or date changes
  useEffect(() => {
    loadOrders();
  }, [selectedDate, loadOrders]);

  // Date navigation functions
  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    const newDate = new Date(selectedDate);
    
    switch (direction) {
      case 'prev':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'next':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'today':
        setSelectedDate(new Date());
        return;
    }
    
    setSelectedDate(newDate);
  };

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // The native date input value is 'YYYY-MM-DD'.
    // We append 'T00:00:00' to ensure the date is parsed consistently as the start of the day in the local timezone.
    const newDate = new Date(e.target.value + 'T00:00:00');
    if (!isNaN(newDate.getTime())) {
      setSelectedDate(newDate);
    }
    // No longer closing the picker on select, as the input element handles it internally when focus is lost.
    setIsDatePickerOpen(false); 
  };


  const toggleFilter = (type: CubeType) => {
    setActiveFilters(prev => {
      if (prev.includes(type)) {
        const newFilters = prev.filter(f => f !== type);
        setShowAllTypes(newFilters.length === 0);
        return newFilters;
      } else {
        setShowAllTypes(false);
        return [...prev, type];
      }
    });
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setShowAllTypes(true);
  };

  const showAllTypesHandler = () => {
    setActiveFilters([]);
    setShowAllTypes(true);
  };

  const getFilteredCubes = () => {
    if (showAllTypes || activeFilters.length === 0) {
      return cubes;
    }
    return cubes.filter(cube => activeFilters.includes(cube.type as CubeType));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Roland': return 'bg-[#636255] border-bg-[#636255] text-white';
      case 'Digital': return 'bg-[#636255] border-bg-[#636255] text-white';
      case 'Sing': return 'bg-[#636255] border-bg-[#636255] text-white';
      case 'Laser': return 'bg-[#636255] border-bg-[#636255] text-white';
      case 'Wood': return 'bg-[#636255] border-bg-[#636255] text-white';
      case 'Reprint': return 'bg-[#636255] border-bg-[#636255] text-white';
      default: return 'bg-[#636255] border-bg-[#636255] text-white';
    }
  };

  const handleComplete = async (id: string) => {
    // Update local state
    setCubes(prev =>
      prev.map(cube =>
        cube.id === id ? { ...cube, completed: true } : cube
      )
    );
    
    // Update database
    await updateOrderStatus(id, 'completed');
  };

  const deleteCube = (id: string) => {
    setCubes(prev => prev.filter(cube => cube.id !== id));
    // Note: You might want to add a soft delete in the database instead
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { over, active } = event;

    if (over) {
      const newTickId = over.id.toString();
      
      // Update local state
      setCubes(prev =>
        prev.map(cube =>
          cube.id === active.id
            ? { ...cube, tickId: newTickId }
            : cube
        )
      );
      
      // Update database
      await updateOrderPosition(
        active.id.toString(), 
        newTickId, 
        formatDateForDB(selectedDate)
      );
    }
  };

  const handleAssignUser = async (cubeId: string, userId: string | null) => {
    // Update local state
    setAssignedUsers(prev => ({
      ...prev,
      [cubeId]: userId
    }));
    
    // Update database
    await assignOrderToUser(cubeId, userId);
  };

  const handleAddJob = () => {
    setShowMenu(true);
  };

  const handleJobSubmit = (jobData: { 
    id: string;
    title: string; 
    orderno: string;
    size: string;
    type: string;
    deadline: number;
  }) => {
    const newCube = {
      ...jobData,
      tickId: null,
      completed: false
    };
    setCubes(prev => [...prev, newCube]);
    setShowMenu(false);
  };

  const moveCubeToTimeline = async (cubeId: string) => {
    const tickCounts = TICKS.map((_, i) => {
      const tickId = `tick-${i}`;
      const cubesInTick = cubes.filter(c => c.tickId === tickId).length;
      return { tickId, count: cubesInTick };
    });

    const availableTick = tickCounts.sort((a, b) => a.count - b.count)[0];

    // Update local state
    setCubes(prev =>
      prev.map(cube =>
        cube.id === cubeId
          ? { ...cube, tickId: availableTick.tickId }
          : cube
      )
    );
    
    // Update database
    await updateOrderPosition(
      cubeId, 
      availableTick.tickId, 
      formatDateForDB(selectedDate)
    );
  };

  const filteredCubes = getFilteredCubes();

  // ----------------------------------------------------------------------
  // 🚀 IMPROVED DATE PICKER IMPLEMENTATION 🚀
  // ----------------------------------------------------------------------
  const BetterDatePicker = () => (
    <div className="relative">
      <button
        onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
        aria-expanded={isDatePickerOpen}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>Pick Date</span>
      </button>
      
      {/* The date input is now an actual dropdown, making it more visible and accessible */}
      {isDatePickerOpen && (
        <div className="absolute top-full mt-2 left-0 z-50">
          <input
            type="date"
            value={formatDateForInput(selectedDate)}
            onChange={handleDateSelect}
            className="p-3 border border-gray-300 rounded-lg shadow-xl bg-white focus:ring-2 focus:ring-[#636255] focus:border-transparent"
            onBlur={() => {
              // Set a small delay to allow the handleDateSelect to fire before closing
              setTimeout(() => setIsDatePickerOpen(false), 100);
            }}
            autoFocus 
          />
        </div>
      )}
    </div>
  );


  return (
    <div>
      {/* Date Navigation Bar */}
      <div className=" p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Previous Day"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={() => navigateDate('today')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isToday(selectedDate) 
                ? 'bg-[#636255] text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Today
          </button>
          
          <button
            onClick={() => navigateDate('next')}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Next Day"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Use the new component */}
          <BetterDatePicker />
        </div>
        
        {/* Date Display (moved here for better separation from navigation) */}
        <div className="text-xl font-semibold text-gray-800">
          {formatDisplayDate(selectedDate)}
          {isToday(selectedDate) && (
            <span className="ml-2 text-sm font-normal text-green-600">(Today)</span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => {
            const tabs = ['task creation', 'user management', 'task tracking'] as const;
            const currentIndex = tabs.indexOf(activeTab);
            const newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
            setActiveTab(tabs[newIndex]);
          }}
          className="p-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          title="Previous tab"
        >
          &#8592;
        </button>
        <h2 className="text-2xl font-bold text-gray-900">{activeTab}</h2>

        <button
          onClick={() => {
            const tabs = ['task creation', 'user management', 'task tracking'] as const;
            const currentIndex = tabs.indexOf(activeTab);
            const newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
            setActiveTab(tabs[newIndex]);
          }}
          className="p-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          title="Next tab"
        >
          &#8594;
        </button>
      </div>
      
      {activeTab === 'task creation' && (
       <div className="">
        <NewJobForm
         onSubmit={handleJobSubmit}
         />
         
        <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 ">Task Queue - Click To Drop</h3>
        <div className="min-h-[10px] bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
          {filteredCubes.filter(c => c.tickId === null).length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 italic">
              {activeFilters.length > 0 
                ? `No ${activeFilters.join(', ')} tasks in queue.`
                : "No tasks in queue. Create a new task to get started."
              }
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {filteredCubes.filter(c => c.tickId === null).map(cube => (
                <div
                  key={cube.id}
                  onClick={() => moveCubeToTimeline(cube.id)}
                  className="cursor-pointer hover:transform hover:scale-105 transition-transform"
                  title="Click to move to timeline"
                >
                  <DraggableCube 
                    id={cube.id} 
                    title={cube.title} 
                    orderno={cube.orderno}
                    type={cube.type} 
                    completed={cube.completed}
                    onDelete={deleteCube} 
                    onComplete={handleComplete} 
                    users={users} 
                    onAssignUser={handleAssignUser} 
                    assignedUser={users.find(u => u.id === assignedUsers[cube.id]) || null}
                    orderData={cube.orderData}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
        </div> 
      )}

      {activeTab === 'task tracking' && (
        <div className="mb-6">
        
        <div className="flex flex-wrap gap-5 ">
          <button
             onClick={showAllTypesHandler}
             className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors text-2xl ${
               showAllTypes 
                 ? 'bg-[#636255] text-white border-[#636255]'
                 : 'bg-white text-[#636255] border-[#636255] hover:bg-gray-50'
             }`}
           >
            All Types 
          </button>
          
          {CUBE_TYPES.map(type => {
            const typeCount = cubes.filter(c => c.type === type).length;
            const isActive = activeFilters.includes(type);
            
            return (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                className={`px-12 py-3.5 rounded-lg border-2 font-medium transition-colors text-2xl ${
                  isActive
                    ? `${getTypeColor(type)} border-current`
                    : 'bg-white text-[#636255] border-[#636255] border-2 hover:bg-gray-50'
                }`}
              >
                {type} 
              </button>
            );
          })}
        </div>
      </div>
      )}
      
      <div className='flex gap-20 mb-4'>
        <div className="text-2xl ">Total Tasks: {filteredCubes.length}</div>
        <div className="text-2xl ">Tasks Completed: {filteredCubes.filter(c => c.completed).length}</div>
        <div className="text-2xl ">Missed Tasks: {filteredCubes.filter(c => !c.completed).length}</div>
        <div className="text-2xl ">In Progress: {filteredCubes.filter(c => !c.completed && c.tickId !== null).length}</div>
      </div>

      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
        <div className="flex justify-between items-center m-4">
          <button
            onClick={() => scroll("left")}
            className="p-2 bg-gray-200 rounded hover:bg-gray-300 z-10"
          >
            &#8592;
          </button>
          
          <button
            onClick={() => scroll("right")}
            className="p-2 bg-gray-200 rounded hover:bg-gray-300 z-10"
          >
            &#8594;
          </button>
        </div>

        <div 
          ref={scrollRef}
          className="overflow-x-auto overflow-y-visible scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="min-w-max mt-70">
            <div className="flex justify-between items-end h-32 w-full min-w-[1200px] gap-[20px]">
              {TICKS.map((_, i) => {
                const tickId = `tick-${i}`;
                const cubesInTick = filteredCubes.filter(c => c.tickId === tickId);

                return (
                  <DroppableTick key={tickId} id={tickId}>
                    {cubesInTick.map((cube, index) => (
                      <div 
                        key={cube.id} 
                        className="absolute"
                        style={{ bottom: `${20 + (index * 160)}px` }}
                      >
                        <DraggableCube 
                          key={cube.id} 
                          id={cube.id} 
                          title={cube.title}
                          orderno={cube.orderno} 
                          type={cube.type} 
                          completed={cube.completed}
                          onDelete={deleteCube} 
                          onComplete={handleComplete} 
                          users={users} 
                          onAssignUser={handleAssignUser} 
                          assignedUser={users.find(u => u.id === assignedUsers[cube.id]) || null}
                          orderData={cube.orderData}
                        />
                      </div>
                    ))}
                  </DroppableTick>
                );
              })}
            </div>
                    
            <div className="border-t-4 border-dashed border-gray-300 w-full min-w-[3700px]" />

            <div className="flex justify-between mt-2 w-full min-w-[1100px]">
              {TICKS.map((_, i) => (
              <div key={i} className="text-xs text-center w-4 font-bold">
                {i}:00
              </div>
            ))}
            </div>
          </div>
        </div>
      </DndContext>
    </div>
  )
}
export default Timeline;