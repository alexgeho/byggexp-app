import React, { useRef, useState, useEffect, useCallback } from "react";

import { View, Text, TouchableOpacity, Animated } from "react-native";

import { PanGestureHandler, State } from "react-native-gesture-handler";

import MCIcon from "react-native-vector-icons/MaterialCommunityIcons";

// Figma pill geometry: 52 tall, 14 gap between pills.
const ITEM_HEIGHT = 52;
const GAP = 14;
const PITCH = ITEM_HEIGHT + GAP;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Drag-to-reorder list of Figma pills. Each row is a pill (label left, 6-dot
// drag handle right, matching the Figma "Second round button" list). Tapping a
// pill toggles it; dragging the handle reorders. Order is kept locally during a
// drag and committed to the parent on release, so parent re-renders (e.g. from a
// toggle) don't fight the gesture. Enabled/disabled state is always read from
// props by id, so toggles reflect immediately.
export function DraggablePillList({
  items,
  onToggle,
  onReorderCommit,
  styles,
  handleColor,
}) {
  const ids = items.map((item) => item.id);
  const itemsById = {};
  items.forEach((item) => {
    itemsById[item.id] = item;
  });

  const [orderIds, setOrderIds] = useState(ids);

  // Per-id animated `top`. Kept in a ref so gesture callbacks can mutate them
  // without re-rendering.
  const tops = useRef({});
  const draggingId = useRef(null);
  const dragIndex = useRef(0);
  const orderRef = useRef(orderIds);
  orderRef.current = orderIds;

  const ensureTop = useCallback((id, index) => {
    if (!tops.current[id]) {
      tops.current[id] = new Animated.Value(index * PITCH);
    }
    return tops.current[id];
  }, []);

  // Sync local order from props when the set of ids changes (add/remove) and no
  // drag is in progress. A pure toggle keeps the same ids, so order is left
  // alone.
  useEffect(
    function syncOrderFromProps() {
      if (draggingId.current) {
        return;
      }
      const sameSet =
        ids.length === orderIds.length &&
        ids.every((id) => orderIds.includes(id));
      if (!sameSet) {
        setOrderIds(ids);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items],
  );

  // Settle every row to its slot whenever the committed order changes and no
  // drag is active.
  useEffect(
    function settleRows() {
      if (draggingId.current) {
        return;
      }
      orderIds.forEach((id, index) => {
        ensureTop(id, index).setValue(index * PITCH);
      });
    },
    [orderIds, ensureTop],
  );

  function springOthersToSlots(currentOrder, skipId) {
    currentOrder.forEach((id, index) => {
      if (id === skipId) {
        return;
      }
      Animated.spring(ensureTop(id, index), {
        toValue: index * PITCH,
        useNativeDriver: true,
        bounciness: 0,
        speed: 20,
      }).start();
    });
  }

  function makeGestureHandlers(id) {
    function onGestureEvent(event) {
      if (draggingId.current !== id) {
        return;
      }
      const startTop = dragIndex.current * PITCH;
      const nextTop = startTop + event.nativeEvent.translationY;
      ensureTop(id, dragIndex.current).setValue(nextTop);

      const order = orderRef.current;
      const targetIndex = clamp(
        Math.round(nextTop / PITCH),
        0,
        order.length - 1,
      );
      if (targetIndex !== dragIndex.current) {
        const nextOrder = order.filter((rowId) => rowId !== id);
        nextOrder.splice(targetIndex, 0, id);
        dragIndex.current = targetIndex;
        orderRef.current = nextOrder;
        setOrderIds(nextOrder);
        springOthersToSlots(nextOrder, id);
      }
    }

    function onHandlerStateChange(event) {
      const { state, oldState } = event.nativeEvent;
      if (state === State.BEGAN || state === State.ACTIVE) {
        if (!draggingId.current) {
          draggingId.current = id;
          dragIndex.current = orderRef.current.indexOf(id);
        }
        return;
      }
      if (
        oldState === State.ACTIVE &&
        (state === State.END ||
          state === State.CANCELLED ||
          state === State.FAILED)
      ) {
        const finalIndex = orderRef.current.indexOf(id);
        Animated.spring(ensureTop(id, finalIndex), {
          toValue: finalIndex * PITCH,
          useNativeDriver: true,
          bounciness: 0,
          speed: 20,
        }).start();
        draggingId.current = null;
        onReorderCommit(orderRef.current);
      }
    }

    return { onGestureEvent, onHandlerStateChange };
  }

  return (
    <View style={[styles.dragList, { height: orderIds.length * PITCH - GAP }]}>
      {orderIds.map((id, index) => {
        const item = itemsById[id];
        if (!item) {
          return null;
        }
        const top = ensureTop(id, index);
        const isDragging = draggingId.current === id;
        const { onGestureEvent, onHandlerStateChange } =
          makeGestureHandlers(id);

        return (
          <Animated.View
            key={id}
            style={[
              styles.dragRow,
              {
                transform: [{ translateY: top }],
                zIndex: isDragging ? 10 : 1,
                elevation: isDragging ? 10 : 0,
                opacity: item.disabled ? 0.4 : 1,
              },
            ]}
          >
            <View style={[styles.item, item.enabled && styles.itemActive]}>
              {/* Tap the label area to toggle; drag the handle to reorder.
                  Kept as siblings so the gesture handler isn't nested inside a
                  Touchable (which conflicts with react-native-gesture-handler). */}
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={item.disabled}
                style={styles.itemLabelTap}
                onPress={() => onToggle(id)}
              >
                <Text
                  style={[
                    styles.itemText,
                    item.enabled && styles.itemTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>

              <PanGestureHandler
                onGestureEvent={onGestureEvent}
                onHandlerStateChange={onHandlerStateChange}
                activeOffsetY={[-6, 6]}
              >
                <Animated.View style={styles.dragHandle}>
                  <MCIcon
                    name="drag-vertical"
                    size={24}
                    color={item.enabled ? "#FFFFFF" : handleColor}
                  />
                </Animated.View>
              </PanGestureHandler>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}
