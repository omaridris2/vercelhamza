import React, { useState, useRef, useEffect, useCallback } from "react";
import { DndContext, closestCorners, DragEndEvent } from "@dnd-kit/core";
import DraggableCube from "./DraggableCube";
import DroppableTick from "./DroppableTick";
import {
  fetchOrders,
  updateOrderPosition,
  updateOrderStatus,
  assignOrderToUser,
} from "@/app/actions/orderActions";

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

type CubeType =
  | "Roland"
  | "Digital"
  | "Sing"
  | "Laser"
  | "Wood"
  | "Reprint";

const CUBE_TYPES: CubeType[] = ["Roland", "Digital", "Sing", "Laser", "Wood", "Reprint"];

const TimelineSearch: React.FC<UserTableProps> = ({ users, loading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [searchOrderNo, setSearchOrderNo] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // Filter state
  const [activeFilters, setActiveFilters] = useState<CubeType[]>([]);
  const [showAllTypes, setShowAllTypes] = useState(true);

  // Fixed timezone functions - work in ANY timezone (Istanbul, Saudi Arabia, etc.)
  const formatDateForDB = useCallback((date: Date) => {
    // Use local timezone, not UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const formatDateForInput = useCallback((date: Date) => {
    // Use local timezone for date input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const formatDisplayDate = useCallback((date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  }, []);

  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, []);

  const [cubes, setCubes] = useState<
    {
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
    }[]
  >([]);

  const [assignedUsers, setAssignedUsers] = useState<{
    [key: string]: string | null;
  }>({});

  const TICKS = Array.from({ length: 24 });

  const loadOrders = useCallback(async () => {
    const result = await fetchOrders();
    if (result.success && result.orders) {
      const allOrderCubes = result.orders.map((order: any) => {
        const orderItem = order.order_items?.[0];
        const product = orderItem?.products;
        return {
          id: order.id.toString(),
          tickId: order.timeline_position || null,
          title: product?.name || "Order",
          orderno: order.order_no || order.id,
          size: `Qty: ${order.Quantity || 1}`,
          type: order.type || "Roland",
          completed: order.status === "completed",
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

      // Show all orders for the selected date
      const visibleCubes = allOrderCubes.filter(
        (cube: any) =>
          cube.tickId === null ||
          cube.timelineDate === formatDateForDB(selectedDate)
      );

      setCubes(visibleCubes);

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
  }, [formatDateForDB, selectedDate]);

  useEffect(() => {
    loadOrders();
  }, [selectedDate, loadOrders]);

  const navigateDate = (direction: "prev" | "next" | "today") => {
    const newDate = new Date(selectedDate);
    if (direction === "prev") newDate.setDate(newDate.getDate() - 1);
    else if (direction === "next") newDate.setDate(newDate.getDate() + 1);
    else setSelectedDate(new Date());
    if (direction !== "today") setSelectedDate(newDate);
  };

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value + "T00:00:00");
    if (!isNaN(newDate.getTime())) setSelectedDate(newDate);
    setIsDatePickerOpen(false);
  };

  const handleComplete = async (id: string) => {
    setCubes((prev) =>
      prev.map((cube) => (cube.id === id ? { ...cube, completed: true } : cube))
    );
    await updateOrderStatus(id, "completed");
  };

  const deleteCube = (id: string) => {
    setCubes((prev) => prev.filter((cube) => cube.id !== id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { over, active } = event;
    if (over) {
      const newTickId = over.id.toString();
      setCubes((prev) =>
        prev.map((cube) =>
          cube.id === active.id ? { ...cube, tickId: newTickId } : cube
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
    setAssignedUsers((prev) => ({ ...prev, [cubeId]: userId }));
    await assignOrderToUser(cubeId, userId);
  };

  const moveCubeToTimeline = async (cubeId: string) => {
    const tickCounts = TICKS.map((_, i) => {
      const tickId = `tick-${i}`;
      const cubesInTick = cubes.filter((c) => c.tickId === tickId).length;
      return { tickId, count: cubesInTick };
    });
    const availableTick = tickCounts.sort((a, b) => a.count - b.count)[0];
    setCubes((prev) =>
      prev.map((cube) =>
        cube.id === cubeId ? { ...cube, tickId: availableTick.tickId } : cube
      )
    );
    await updateOrderPosition(
      cubeId,
      availableTick.tickId,
      formatDateForDB(selectedDate)
    );
  };

  const handleSearch = async () => {
    if (!searchOrderNo.trim()) return;

    setIsSearching(true);

    try {
      const result = await fetchOrders();

      if (result.success && result.orders) {
        const match = result.orders.find(
          (order: any) =>
            order.order_no?.toString() === searchOrderNo.trim()
        );

        if (match) {
          // Check if order has a timeline date
          if (match.timeline_date) {
            // Parse the date string correctly to avoid timezone issues
            // timeline_date is in format 'YYYY-MM-DD'
            const [year, month, day] = match.timeline_date.split('-').map(Number);
            const orderDate = new Date(year, month - 1, day); // month is 0-indexed
            setSelectedDate(orderDate);
          }

          // Check if unplaced
          if (!match.timeline_position || match.timeline_position === "EMPTY" || match.timeline_position === null) {
            alert("✅ Order found but not yet placed on the timeline.");
            return;
          }

          // Auto-scroll to cube's tick position
          setTimeout(() => {
            const tickIndex = parseInt(
              match.timeline_position?.replace("tick-", "") || "0",
              10
            );
            if (!isNaN(tickIndex) && scrollRef.current) {
              const scrollAmount = tickIndex * 150;
              scrollRef.current.scrollTo({
                left: scrollAmount,
                behavior: "smooth",
              });
            }
          }, 300);
        } else {
          alert("❌ No order found with that number.");
        }
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const clearSearch = () => {
    setSearchOrderNo("");
  };

  // Filter functions
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

  const showAllTypesHandler = () => {
    setActiveFilters([]);
    setShowAllTypes(true);
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

  const getFilteredCubes = () => {
    if (showAllTypes || activeFilters.length === 0) {
      return cubes;
    }
    return cubes.filter(cube => activeFilters.includes(cube.type as CubeType));
  };

  const moveCubeToQueue = async (cubeId: string) => {
  
  
  
  }

  const filteredCubes = getFilteredCubes();

  const BetterDatePicker = () => (
    <div className="relative">
      <button
        onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
        aria-expanded={isDatePickerOpen}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
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
            autoFocus
          />
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Date Navigation Header */}
      <div className="flex flex-wrap gap-7 justify-center mb-5">
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
      <div className="p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateDate("prev")}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Previous Day"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={() => navigateDate("today")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isToday(selectedDate) 
                ? 'bg-[#636255] text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Today
          </button>
          
          <button
            onClick={() => navigateDate("next")}
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

      

      {/* Search Section */}
      <div className="mb-8">
        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            value={searchOrderNo}
            onChange={(e) => setSearchOrderNo(e.target.value)}
            placeholder="Enter Order Number to search..."
            onKeyDown={handleKeyDown}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636255] focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-[#636255] text-white rounded-lg hover:bg-[#504f44] disabled:opacity-50 transition"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
          {searchOrderNo && (
            <button
              onClick={clearSearch}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Task Type Filters */}
      <div className="mb-6">
        
        
      </div>

      {/* Timeline Section */}
      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => {
              if (scrollRef.current) {
                scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
              }
            }}
            className="p-2 bg-gray-200 rounded hover:bg-gray-300 z-10"
          >
            &#8592;
          </button>
          
          <button
            onClick={() => {
              if (scrollRef.current) {
                scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
              }
            }}
            className="p-2 bg-gray-200 rounded hover:bg-gray-300 z-10"
          >
            &#8594;
          </button>
        </div>

        <div
          ref={scrollRef}
          className="overflow-x-auto overflow-y-visible scrollbar-hide"
        >
          <div className="min-w-max mt-70">
            {/* Dynamically adjust timeline height */}
{(() => {
  const maxStack = Math.max(
    ...TICKS.map((_, i) =>
      filteredCubes.filter(c => c.tickId === `tick-${i}`).length
    )
  );

  // Base height = 8rem (h-32)
  // Add 8rem (128px) for every 2 cubes beyond the first two
  const timelineHeight = 128 + Math.max(0, maxStack - 2) * 120;

  return (
    <div
      className="flex justify-between items-end w-full min-w-[1200px] gap-[20px] transition-all duration-300"
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
            <div className="flex justify-between mt-2 min-w-[1100px]">
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
  );
};

export default TimelineSearch;