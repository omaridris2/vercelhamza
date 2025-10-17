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

const TimelineSearch: React.FC<UserTableProps> = ({ users, loading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  // For searching orders (past, present, future)
const [searchOrderNo, setSearchOrderNo] = useState("");
const [confirmedSearch, setConfirmedSearch] = useState("");
const [searchResult, setSearchResult] = useState<any | null>(null);
const [isSearching, setIsSearching] = useState(false);


  const formatDateForDB = useCallback(
    (date: Date) => date.toISOString().split("T")[0],
    []
  );
  const formatDateForInput = useCallback(
    (date: Date) => date.toISOString().split("T")[0],
    []
  );
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
    // Don't allow dragging if search is active
    if (searchOrderNo) return;
    
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
  setConfirmedSearch(searchOrderNo.trim());
  setSearchResult(null);

  try {
    const result = await fetchOrders();

    if (result.success && result.orders) {
      const match = result.orders.find(
        (order: any) =>
          order.order_no?.toString() === searchOrderNo.trim()
      );

      if (match) {
        const product = match.order_items?.[0]?.products;

        setSearchResult({
          id: match.id.toString(),
          orderno: match.order_no || match.id,
          
          size: `Qty: ${match.Quantity || 1}`,
          type: match.type || "Roland",
          completed: match.status === "completed",
          assignedUserId: match.assigned_user_id,
          timelineDate: match.timeline_date || null,
          orderData: match,
          creatorUser: match.creator || null,
          customerName: match.customer_name,
          createdAt: match.created_at,
        });

        // ✅ Check if unplaced
        if (!match.timeline_position || match.timeline_position === "EMPTY" || match.timeline_position === null) {
          alert("✅ Order found but not yet placed on the timeline.");
          return;
        }

        // ✅ Auto-scroll to cube's tick position
        const tickIndex = parseInt(
          match.timeline_position?.replace("tick-", "") || "0",
          10
        );
        if (!isNaN(tickIndex) && scrollRef.current) {
          const scrollAmount = tickIndex * 150; // adjust based on tick width
          scrollRef.current.scrollTo({
            left: scrollAmount,
            behavior: "smooth",
          });
        }

      } else {
        setSearchResult("not-found");
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

const filteredCubes =
  confirmedSearch !== ""
    ? cubes.filter(
        (cube) => cube.orderNo?.toString() === confirmedSearch // exact match only
      )
    : [];


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
    {/* 🔍 Global Search Section */}
    <div className="mb-8">
      <div className="flex gap-2 max-w-md">
        <input
          type="text"
          value={searchOrderNo}
          onChange={(e) => setSearchOrderNo(e.target.value)}
          placeholder="Enter full Order Number..."
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636255] focus:border-transparent"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-4 py-2 bg-[#636255] text-white rounded-lg hover:bg-[#504f44] disabled:opacity-50 transition"
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Search Result Display */}
      {confirmedSearch && (
        <div className="mt-4">
          {searchResult === "not-found" && (
            <div className="text-red-600 font-medium">
              No order found with number {confirmedSearch}.
            </div>
          )}

         
        </div>
      )}
    </div>

    {/* 🕒 Timeline Section */}
    <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-visible scrollbar-hide"
      >
        <div className="min-w-max mt-70">
          <div className="flex justify-between items-end h-32 gap-5 min-w-[1200px]">
            {TICKS.map((_, i) => {
              const tickId = `tick-${i}`;
              const cubesInTick = filteredCubes.filter(
                (c) => c.tickId === tickId
              );
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
                          users.find(
                            (u) => u.id === assignedUsers[cube.id]
                          ) || null
                        }
                        creatorUser={cube.creatorUser}
                        orderData={cube.orderData}
                        isReadOnly={true}
                      />
                    </div>
                  ))}
                </DroppableTick>
              );
            })}
          </div>
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