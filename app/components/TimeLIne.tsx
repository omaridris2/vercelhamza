import React, { useState, useRef, useEffect, useCallback } from 'react'
import { DndContext, closestCorners, DragEndEvent } from '@dnd-kit/core';
import DraggableCube from './DraggableCube';
import DroppableTick from './DroppableTick';
import NewJobForm from './NewJobForm';
import { fetchOrders, updateOrderPosition, updateOrderStatus, assignOrderToUser, deleteOrder } from '@/app/actions/orderActions';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  type?: string | null;
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
  const [activeTab, setActiveTab] = useState<'task creation' | 'task tracking'>('task creation');
  const scrollRef = useRef<HTMLDivElement>(null);
  const designerScrollRef = useRef<HTMLDivElement>(null);
  
  const [activeFilters, setActiveFilters] = useState<CubeType[]>([]);
  const [showAllTypes, setShowAllTypes] = useState(true);
  
  const [activeUserFilters, setActiveUserFilters] = useState<string[]>([]);
  const [showAllUsers, setShowAllUsers] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  // Add reprint state tracking
  const [reprintCubes, setReprintCubes] = useState<Set<string>>(new Set());

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

  // ✅ Updated: Exclude reprint tasks from being marked as missed
  const isTaskMissed = (cube: any) => {
    // Don't mark reprint tasks as missed
    if (reprintCubes.has(cube.id)) return false;
    
    if (!cube.orderData?.deadline) return false;
    const now = new Date();
    const deadline = new Date(cube.orderData.deadline);
    return deadline.getTime() - now.getTime() < 0;
  };

  const scrollDesigners = (direction: "left" | "right") => {
    if (designerScrollRef.current) {
      const scrollAmount = 300;
      if (direction === "left") {
        designerScrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        designerScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  const moveCubeToQueue = async (cubeId: string) => {
    const cube = cubes.find(c => c.id === cubeId);
    if (!cube) return;
    
    // ✅ Allow reprint tasks to be moved
    if (!reprintCubes.has(cubeId) && (cube.completed || isTaskMissed(cube))) {
      return;
    }
    
    setCubes(prev =>
      prev.map(cube =>
        cube.id === cubeId
          ? { ...cube, tickId: null, timelineDate: null }
          : cube
      )
    );
    
    await updateOrderPosition(cubeId, null, null);
  };

  // ✅ Updated: Mark as reprint function with database update
  const handleMarkAsReprint = async (cubeId: string) => {
    setReprintCubes(prev => new Set(prev).add(cubeId));
    
    // Update database status to reprint
    await updateOrderStatus(cubeId, 'reprint');
    
    // Update local state - clear completed status when marking as reprint
    setCubes(prev =>
      prev.map(cube =>
        cube.id === cubeId
          ? { 
              ...cube, 
              type: 'Reprint',
              completed: false,  // ✅ Clear completed flag
              orderData: { 
                ...cube.orderData, 
                status: 'reprint',
                completed_at: null  // ✅ Clear completed timestamp
              }
            }
          : cube
      )
    );
  };

  const TICKS = Array.from({ length: 24 });
  
  const [cubes, setCubes] = useState<{
    id: string;
    tickId: string | null;
    title: string;
    orderno: number | string;
    size: string;
    type: string;
    completed: boolean;
    assignedUserId?: string | null;
    orderData?: any;
    creatorUser: User | null;
timelineDate?: string | null;
    customerName?: string | null;
    orderNo?: number | null;
    createdAt?: string;
    updatedAt?: string | null;
    completedAt?: string | null;
  }[]>([]);

  const [assignedUsers, setAssignedUsers] = useState<{[key: string]: string | null}>({});
  const [showMenu, setShowMenu] = useState(false);

  const formatDateForDB = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const formatDateForInput = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  // ✅ Updated: Load orders and initialize reprint status from database
  const loadOrders = useCallback(async () => {
    console.log('Loading orders for date:', formatDateForDB(selectedDate));

    const result = await fetchOrders();

    if (result.success && result.orders && result.orders.length > 0) {
      const allOrderCubes = result.orders.map((order: any) => {
        const orderItem = order.order_items?.[0];
        const product = orderItem?.products;

        return {
          id: order.id.toString(),
          tickId: order.timeline_position || null,
          title: product?.name || 'Order',
          orderno: order.order_no || order.id,
          size: `Qty: ${order.Quantity || 1}`,
          type: order.type || 'Roland',
          completed: order.status === 'completed',
          assignedUserId: order.assigned_user_id,
          timelineDate: order.timeline_date || null,
          orderData: order,
          creatorUser: order.creator || null,
          customerName: order.customer_name,
          orderNo: order.order_no,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          completedAt: order.completed_at,
        };
      });

      const visibleCubes = allOrderCubes.filter(
        (cube: any) =>
          cube.tickId === null ||
          cube.timelineDate === formatDateForDB(selectedDate)
      );

      setCubes(visibleCubes);

      // ✅ Initialize reprint cubes from database status
      const reprintIds = new Set(
        visibleCubes
          .filter((cube: any) => cube.orderData?.status === 'reprint')
          .map((cube: any) => cube.id)
      );
      setReprintCubes(reprintIds);

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
      setReprintCubes(new Set());
    }
  }, [formatDateForDB, selectedDate]);

  useEffect(() => {
    loadOrders();
  }, [selectedDate, loadOrders]);

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
    const newDate = new Date(e.target.value + 'T00:00:00');
    if (!isNaN(newDate.getTime())) {
      setSelectedDate(newDate);
    }
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

  const toggleUserFilter = (userId: string) => {
    setActiveUserFilters(prev => {
      if (prev.includes(userId)) {
        const newFilters = prev.filter(id => id !== userId);
        setShowAllUsers(newFilters.length === 0);
        return newFilters;
      } else {
        setShowAllUsers(false);
        return [...prev, userId];
      }
    });
  };

  const showAllUsersHandler = () => {
    setActiveUserFilters([]);
    setShowAllUsers(true);
  };

  const designers = users.filter(user => user.role.toLowerCase() === 'designer');

  const getFilteredCubes = () => {
    let filtered = cubes;
    
    if (!showAllTypes && activeFilters.length > 0) {
      filtered = filtered.filter(cube => activeFilters.includes(cube.type as CubeType));
    }
    
    if (!showAllUsers && activeUserFilters.length > 0) {
      filtered = filtered.filter(cube => 
        cube.assignedUserId && activeUserFilters.includes(cube.assignedUserId)
      );
    }
    
    return filtered;
  };

  const getFilteredDesigners = () => {
    let filtered = designers;
    
    if (!showAllTypes && activeFilters.length > 0) {
      filtered = filtered.filter(designer => 
        designer.type && activeFilters.includes(designer.type as CubeType)
      );
    }
    
    return filtered;
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

  // ✅ Updated: Handle completing tasks including reprints
const handleComplete = async (id: string) => {
  // Remove from reprint set if it was a reprint
  if (reprintCubes.has(id)) {
    setReprintCubes(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }

  // Update local state
  setCubes(prev =>
    prev.map(cube =>
      cube.id === id 
        ? { 
            ...cube, 
            completed: true,
            orderData: {
              ...cube.orderData,
              status: 'completed'
            }
          } 
        : cube
    )
  );
  
  // Update database
  await updateOrderStatus(id, 'completed');
};

  const deleteCube = async (id: string) => {
    try {
      await deleteOrder(id);
      setCubes(prev => prev.filter(cube => cube.id !== id));
      setReprintCubes(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
      console.error("Failed to delete order:", error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { over, active } = event;

    if (over) {
      const cube = cubes.find(c => c.id === active.id);
      
      // ✅ Allow reprint tasks to be dragged, block others if completed/missed
      if (cube && !reprintCubes.has(cube.id) && (cube.completed || isTaskMissed(cube))) {
        return;
      }
      
      const newTickId = over.id.toString();
      
      setCubes(prev =>
        prev.map(cube =>
          cube.id === active.id
            ? { ...cube, tickId: newTickId }
            : cube
        )
      );
      
      await updateOrderPosition(
        active.id.toString(), 
        newTickId, 
        formatDateForDB(selectedDate)
      );
    }
  };

  const handleAssignUser = async (cubeId: string, userId: string | null) => {
    setAssignedUsers(prev => ({
      ...prev,
      [cubeId]: userId
    }));
    
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
      completed: false,
      creatorUser: null
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

    setCubes(prev =>
      prev.map(cube =>
        cube.id === cubeId
          ? { ...cube, tickId: availableTick.tickId }
          : cube
      )
    );
    
    await updateOrderPosition(
      cubeId, 
      availableTick.tickId, 
      formatDateForDB(selectedDate)
    );
  };

  const filteredCubes = getFilteredCubes();

  // ✅ Updated: Task stats now properly handle reprint status
  const getTaskStats = () => {
  const now = new Date();
  const oneHourInMs = 60 * 60 * 1000;

  const placedCubes = filteredCubes.filter(cube => cube.tickId !== null);

  const stats = {
    total: placedCubes.length,
    completed: 0,
    urgent: 0,
    missed: 0,
    reprint: 0,
    inProcess: 0  // ✅ Add this
  };

  placedCubes.forEach(cube => {
    // Check reprint first (highest priority)
    if (reprintCubes.has(cube.id)) {
      stats.reprint++;
    } else if (cube.completed) {
      stats.completed++;
    } else if (cube.orderData?.deadline) {
      const deadline = new Date(cube.orderData.deadline);
      const timeUntilDeadline = deadline.getTime() - now.getTime();

      if (timeUntilDeadline < 0) {
        stats.missed++;
      } else if (timeUntilDeadline <= oneHourInMs) {
        stats.urgent++;
      } else {
        stats.inProcess++;  // ✅ Active task
      }
    } else {
      stats.inProcess++;  // ✅ Task with no deadline
    }
  });

  return stats;
};

  const taskStats = getTaskStats();

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
      
      {isDatePickerOpen && (
        <div className="absolute top-full mt-2 left-0 z-50">
          <input
            type="date"
            value={formatDateForInput(selectedDate)}
            onChange={handleDateSelect}
            className="p-3 border border-gray-300 rounded-lg shadow-xl bg-white focus:ring-2 focus:ring-[#636255] focus:border-transparent"
            onBlur={() => {
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
      {/* date navigation */}
      <div className="p-4 mb-6 flex items-center justify-between">
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
          
          <BetterDatePicker />
        </div>
        
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
            const tabs = ['task creation', 'task tracking'] as const;
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
            const tabs = ['task creation', 'task tracking'] as const;
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
  userId={users?.[0]?.id || ''}
  onJobCreated={(newJob) => {
    setCubes((prev) => [...prev, newJob]); // ✅ instantly append to UI
  }}
/>

         
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700">Task Queue - Click To Drop</h3>
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
                        creatorUser={cube.creatorUser}
                        orderData={cube.orderData}
                        onMoveToQueue={moveCubeToQueue}
                        isMissed={isTaskMissed(cube)}
                        isReprint={reprintCubes.has(cube.id)}
                        onMarkAsReprint={handleMarkAsReprint}
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
          {/* Task Type Filters */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Filter by Task Type</h3>
            <div className="flex flex-wrap gap-5">
              <button
                onClick={showAllTypesHandler}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors text-2xl ${
                  showAllTypes 
                    ? 'bg-[#636255] text-white border-[#636255]'
                    : 'bg-white text-[#636255] border-[#636255] hover:bg-gray-50'
                }`}
              >
                All Types {showAllTypes && <span className="ml-2"></span>}
              </button>
              
              {CUBE_TYPES.map(type => {
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
                    {type} {isActive && <span className="ml-2"></span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Designer Filters */}
          {designers.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Filter by Designer</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => scrollDesigners("left")}
                  className="p-2 bg-gray-200 rounded hover:bg-gray-300 flex-shrink-0"
                >
                  &#8592;
                </button>
                
                <div 
                  ref={designerScrollRef}
                  className="flex gap-5 overflow-x-auto scrollbar-hide flex-1"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <button
                    onClick={showAllUsersHandler}
                    className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors text-2xl flex-shrink-0 ${
                      showAllUsers 
                        ? 'bg-[#636255] text-white border-[#636255]'
                        : 'bg-white text-[#636255] border-[#636255] hover:bg-gray-50'
                    }`}
                  >
                    All Designers {showAllUsers && <span className="ml-2"></span>}
                  </button>
                  
                  {getFilteredDesigners().map(designer => {
                    const isActive = activeUserFilters.includes(designer.id);
                    
                    return (
                      <button
                        key={designer.id}
                        onClick={() => toggleUserFilter(designer.id)}
                        className={`px-12 py-3.5 rounded-lg border-2 font-medium transition-colors text-2xl flex-shrink-0 ${
                          isActive
                            ? 'bg-[#636255] text-white border-[#636255]'
                            : 'bg-white text-[#636255] border-[#636255] hover:bg-gray-50'
                        }`}
                      >
                        {designer.name} {isActive && <span className="ml-2"></span>}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => scrollDesigners("right")}
                  className="p-2 bg-gray-200 rounded hover:bg-gray-300 flex-shrink-0"
                >
                  &#8594;
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className='flex gap-20 mb-4'>
  <div className="text-2xl font-semibold">
    In Process: <span>{taskStats.inProcess}</span>
  </div>
  <div className="text-2xl font-semibold">
    Tasks Completed: <span className="text-green-600">{taskStats.completed}</span>
  </div>
  
  <div className="text-2xl font-semibold">
    Missed: <span className="text-red-600">{taskStats.missed}</span>
  </div>
  <div className="text-2xl font-semibold">
    Reprint: <span className="text-gray-600">{taskStats.reprint}</span>
  </div>
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
            {(() => {
              const maxStack = Math.max(
                ...TICKS.map((_, i) =>
                  filteredCubes.filter(c => c.tickId === `tick-${i}`).length
                )
              );

              const timelineHeight = 128 + Math.max(0, maxStack - 2) * 120;

              return (
                <div
                  className="flex justify-between items-end w-full min-w-[1200px] gap-[20px] transition-all duration-300 px-4"
                  style={{ height: `${timelineHeight}px` }}
                >
                  {TICKS.map((_, i) => {
                    const tickId = `tick-${i}`;
                    const cubesInTick = filteredCubes.filter(c => c.tickId === tickId);

                    return (
                      <DroppableTick key={tickId} id={tickId}>
                        {cubesInTick.map((cube, index) => (
                          <div
                            key={cube.id}
                            className="absolute"
                            style={{ bottom: `${20 + index * 160}px` }}
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
                              assignedUser={
                                users.find(u => u.id === assignedUsers[cube.id]) || null
                              }
                              creatorUser={cube.creatorUser}
                              orderData={cube.orderData}
                              onMoveToQueue={moveCubeToQueue}
                              isMissed={isTaskMissed(cube)}
                              isReprint={reprintCubes.has(cube.id)}
                              onMarkAsReprint={handleMarkAsReprint}
                            />
                          </div>
                        ))}
                      </DroppableTick>
                    );
                  })}
                </div>
              );
            })()}
                    
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