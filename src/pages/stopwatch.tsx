/**
 * Stopwatch
 *
 * A precision stopwatch timer for measuring elapsed time.
 *
 * Features:
 * - Start/Stop functionality
 * - Lap/split time recording
 * - Reset functionality
 * - Millisecond precision display
 * - Lap times list
 * - Copy lap times
 *
 * How to use:
 * 1. Click Start to begin the timer
 * 2. Click Lap to record split times
 * 3. Click Stop to pause the timer
 * 4. Click Reset to clear all times
 * 5. View and copy lap times from the list
 */

import React, { useState, useEffect, useRef } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { CopyButton } from "../components/ui/copy-button";
import { useToolState } from "../hooks/useToolState";

interface LapTime {
  lap: number;
  time: number;
  split: number;
}

interface StopwatchState {
  laps: LapTime[];
}

const initialState: StopwatchState = {
  laps: [],
};

function formatTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = Math.floor((ms % 1000) / 10);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`;
}

export function StopwatchPage() {
  const [state, setState, clearState] = useToolState("stopwatch", initialState);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsedRef.current;
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        elapsedRef.current = now - (startTimeRef.current || now);
        setElapsed(elapsedRef.current);
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleStartStop = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      setIsRunning(true);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsed(0);
    elapsedRef.current = 0;
    setState(initialState);
    startTimeRef.current = null;
  };

  const handleLap = () => {
    if (!isRunning) return;

    const lapNumber = state.laps.length + 1;
    const lapTime = elapsed;
    const splitTime =
      state.laps.length > 0
        ? elapsed - state.laps[state.laps.length - 1].time
        : elapsed;

    setState((prev) => ({
      ...prev,
      laps: [
        ...prev.laps,
        {
          lap: lapNumber,
          time: lapTime,
          split: splitTime,
        },
      ],
    }));
  };

  const lapTimesText = state.laps
    .map(
      (lap) =>
        `Lap ${lap.lap}: ${formatTime(lap.time)} (Split: ${formatTime(lap.split)})`,
    )
    .join("\n");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Stopwatch</h1>
        <p className="text-muted-foreground">
          Precision timer for measuring elapsed time
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Time</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="text-6xl font-bold font-mono py-8">
              {formatTime(elapsed)}
            </div>

            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                onClick={handleStartStop}
                className={
                  isRunning
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-green-500 hover:bg-green-600"
                }
              >
                {isRunning ? "Stop" : "Start"}
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={handleLap}
                disabled={!isRunning}
              >
                Lap
              </Button>

              <Button size="lg" variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {state.laps.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lap Times</CardTitle>
              <CopyButton value={lapTimesText} />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-3 text-sm font-medium text-muted-foreground px-4">
                  <div>Lap</div>
                  <div className="text-right">Split</div>
                  <div className="text-right">Total</div>
                </div>
                {[...state.laps].reverse().map((lap) => (
                  <div
                    key={lap.lap}
                    className="grid grid-cols-3 px-4 py-2 rounded bg-muted"
                  >
                    <div className="font-medium">Lap {lap.lap}</div>
                    <div className="text-right font-mono">
                      {formatTime(lap.split)}
                    </div>
                    <div className="text-right font-mono">
                      {formatTime(lap.time)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
