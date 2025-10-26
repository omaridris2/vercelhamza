"use client"
import React, { useState, useRef, useCallback } from "react";
import { DndContext, closestCorners } from "@dnd-kit/core";
import DraggableCube from "../components/DraggableCube";
import DroppableTick from "../components/DroppableTick";

import { fetchOrders } from "@/app/actions/orderActions";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  type?: string | null;
  createdAt: Date;
};

interface TrackOrderProps {
  users: User[];
}

const TrackOrder: React.FC<TrackOrderProps> = ({ users }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchOrderNo, setSearchOrderNo] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [foundOrder, setFoundOrder] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const TICKS = Array.from({ length: 24 });

  const formatDateForDisplay = useCallback((date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  }, []);

  const handleSearch = async () => {
    if (!searchOrderNo.trim()) {
      setErrorMessage("Please enter an order number");
      return;
    }

    setIsSearching(true);
    setErrorMessage("");
    setFoundOrder(null);
    setSelectedDate(null);

    try {
      const result = await fetchOrders();

      if (result.success && result.orders) {
        const match = result.orders.find(
          (order: any) => order.order_no?.toString() === searchOrderNo.trim()
        );

        if (match) {
          if (!match.timeline_position || match.timeline_position === "EMPTY" || match.timeline_position === null) {
            setErrorMessage("Order found but not yet placed on the timeline.");
            return;
          }

          if (!match.timeline_date) {
            setErrorMessage("Order found but has no scheduled date.");
            return;
          }

          const [year, month, day] = match.timeline_date.split('-').map(Number);
          const orderDate = new Date(year, month - 1, day);
          setSelectedDate(orderDate);

          const orderItem = match.order_items?.[0];
          const product = orderItem?.products;
          
          setFoundOrder({
            id: match.id.toString(),
            tickId: match.timeline_position,
            title: product,
            orderno: match.order_no || match.id,
            size: `Qty: ${match.Quantity || 1}`,
            type: match.type || "Roland",
            completed: match.status === "completed",
            assignedUserId: match.assigned_user_id,
            timelineDate: match.timeline_date,
            orderData: match,
            creatorUser: match.creator || null,
            customerName: match.customer_name,
            orderNo: match.order_no,
            createdAt: match.created_at,
            updatedAt: match.updated_at,
            completedAt: match.completed_at,
          });

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
          setErrorMessage("No order found with that number.");
        }
      }
    } catch (error) {
      setErrorMessage("Error searching for order. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const clearSearch = () => {
    setSearchOrderNo("");
    setFoundOrder(null);
    setSelectedDate(null);
    setErrorMessage("");
  };

  const getAssignedUser = () => {
    if (foundOrder?.assignedUserId) {
      return users.find(u => u.id === foundOrder.assignedUserId) || null;
    }
    return null;
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Track Order</h1>

      <div className="mb-8 bg-white p-6 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter Order Number
        </label>
        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            value={searchOrderNo}
            onChange={(e) => setSearchOrderNo(e.target.value)}
            placeholder="Enter Order Number..."
            onKeyDown={handleKeyDown}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636255] focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-6 py-2 bg-[#636255] text-white rounded-lg hover:bg-[#504f44] disabled:opacity-50 transition"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
          {(searchOrderNo || foundOrder) && (
            <button
              onClick={clearSearch}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Clear
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            {errorMessage}
          </div>
        )}
      </div>

      {foundOrder && selectedDate && (
        <div>
          <div className="mb-6 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Order Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600">Order Number:</span>
                <span className="ml-2 font-semibold">{foundOrder.orderNo}</span>
              </div>
              <div>
                <span className="text-gray-600">Type:</span>
                <span className="ml-2 font-semibold">{foundOrder.type}</span>
              </div>
              <div>
                <span className="text-gray-600">Customer:</span>
                <span className="ml-2 font-semibold">{foundOrder.customerName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className={`ml-2 font-semibold ${foundOrder.completed ? 'text-green-600' : 'text-orange-600'}`}>
                  {foundOrder.completed ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Scheduled Date:</span>
                <span className="ml-2 font-semibold">{formatDateForDisplay(selectedDate)}</span>
              </div>
              <div>
                
              </div>
            </div>
          </div>

          {/*timeline Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Timeline Position</h2>
            
            <DndContext collisionDetection={closestCorners}>
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
                <div className="min-w-max">
                  <div
                    className="flex justify-between items-end w-full min-w-[1200px] gap-[20px]"
                    style={{ height: "300px" }}
                  >
                    {TICKS.map((_, i) => {
                      const tickId = `tick-${i}`;
                      const isOrderHere = foundOrder.tickId === tickId;

                      return (
                        <DroppableTick key={tickId} id={tickId}>
                          {isOrderHere && (
                            <div className="absolute" style={{ bottom: "20px" }}>
                              <DraggableCube
                                id={foundOrder.id}
                                title={foundOrder.title}
                                orderno={foundOrder.orderno}
                                type={foundOrder.type}
                                completed={foundOrder.completed}
                                onDelete={() => {}}
                                onComplete={() => {}}
                                users={users}
                                onAssignUser={() => {}}
                                assignedUser={getAssignedUser()}
                                creatorUser={foundOrder.creatorUser}
                                orderData={foundOrder.orderData}
                                onMoveToQueue={() => {}}
                                isReadOnly={true}
                              />
                            </div>
                          )}
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
        </div>
      )}

      {!foundOrder && !errorMessage && (
        <div className="text-center py-12 text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="text-lg">Search for an order to view its timeline position</p>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;