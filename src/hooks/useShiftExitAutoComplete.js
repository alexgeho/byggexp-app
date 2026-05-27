import { useEffect, useRef } from "react";
import {
  subscribeToShiftAutoCompleted,
  subscribeToShiftLocationCheckError,
} from "../utils/shiftExitAutoCompleteEvents";

const getShiftId = (shift) => shift?.id || shift?._id;

export const useShiftExitAutoComplete = ({
  currentShift,
  onShiftAutoCompleted,
  onCheckError,
}) => {
  const completedShiftIdRef = useRef(null);
  const callbacksRef = useRef({
    onShiftAutoCompleted,
    onCheckError,
  });

  useEffect(() => {
    callbacksRef.current = {
      onShiftAutoCompleted,
      onCheckError,
    };
  }, [onShiftAutoCompleted, onCheckError]);

  useEffect(() => {
    const shiftId = getShiftId(currentShift);

    const unsubscribeAutoCompleted = subscribeToShiftAutoCompleted(
      async (completedShift) => {
        const completedShiftId = getShiftId(completedShift);

        if (!shiftId || shiftId !== completedShiftId) {
          return;
        }

        if (completedShiftIdRef.current === completedShiftId) {
          return;
        }

        completedShiftIdRef.current = completedShiftId;
        await callbacksRef.current.onShiftAutoCompleted?.(completedShift);
      },
    );

    const unsubscribeCheckError = subscribeToShiftLocationCheckError(
      async (error) => {
        if (!shiftId) {
          return;
        }

        await callbacksRef.current.onCheckError?.(error);
      },
    );

    return () => {
      unsubscribeAutoCompleted();
      unsubscribeCheckError();
    };
  }, [currentShift]);
};

export default useShiftExitAutoComplete;
