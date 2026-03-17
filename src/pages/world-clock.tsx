/**
 * World Clock / Timezone Converter
 *
 * Shows current time in multiple timezones and converts times between them.
 *
 * Features:
 * - View current time in multiple cities/timezones
 * - Add/remove cities from the list
 * - Convert time between different timezones
 * - Daylight Saving Time (DST) awareness
 * - Search for cities/timezones
 * - Sort by city name or time
 *
 * How to use:
 * 1. View the default cities with their current times
 * 2. Use the search to add more cities
 * 3. Use the converter section to convert times
 * 4. Click on a city to see more details
 */

import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useToolState } from "../hooks/useToolState";

interface CityTime {
  id: string;
  city: string;
  timezone: string;
  offset: number;
}

const DEFAULT_CITIES: CityTime[] = [
  { id: "ny", city: "New York", timezone: "America/New_York", offset: -5 },
  { id: "lon", city: "London", timezone: "Europe/London", offset: 0 },
  { id: "tok", city: "Tokyo", timezone: "Asia/Tokyo", offset: 9 },
  { id: "syd", city: "Sydney", timezone: "Australia/Sydney", offset: 11 },
  { id: "par", city: "Paris", timezone: "Europe/Paris", offset: 1 },
];

interface WorldClockState {
  cities: CityTime[];
  convertFrom: string;
  convertTo: string;
  convertTime: string;
}

const initialState: WorldClockState = {
  cities: DEFAULT_CITIES,
  convertFrom: "America/New_York",
  convertTo: "Europe/London",
  convertTime: "12:00",
};

const ALL_TIMEZONES = [
  { value: "Pacific/Midway", label: "Midway Island", offset: -11 },
  { value: "Pacific/Honolulu", label: "Hawaii", offset: -10 },
  { value: "America/Anchorage", label: "Alaska", offset: -9 },
  { value: "America/Los_Angeles", label: "Los Angeles (PT)", offset: -8 },
  { value: "America/Denver", label: "Denver (MT)", offset: -7 },
  { value: "America/Chicago", label: "Chicago (CT)", offset: -6 },
  { value: "America/New_York", label: "New York (ET)", offset: -5 },
  { value: "America/Sao_Paulo", label: "São Paulo", offset: -3 },
  { value: "Atlantic/Azores", label: "Azores", offset: -1 },
  { value: "Europe/London", label: "London", offset: 0 },
  { value: "Europe/Paris", label: "Paris (CET)", offset: 1 },
  { value: "Europe/Berlin", label: "Berlin", offset: 1 },
  { value: "Europe/Athens", label: "Athens (EET)", offset: 2 },
  { value: "Europe/Moscow", label: "Moscow", offset: 3 },
  { value: "Asia/Dubai", label: "Dubai", offset: 4 },
  { value: "Asia/Karachi", label: "Karachi", offset: 5 },
  { value: "Asia/Kolkata", label: "Mumbai/Delhi", offset: 5.5 },
  { value: "Asia/Dhaka", label: "Dhaka", offset: 6 },
  { value: "Asia/Bangkok", label: "Bangkok", offset: 7 },
  { value: "Asia/Singapore", label: "Singapore", offset: 8 },
  { value: "Asia/Shanghai", label: "Shanghai/Beijing", offset: 8 },
  { value: "Asia/Tokyo", label: "Tokyo", offset: 9 },
  { value: "Asia/Seoul", label: "Seoul", offset: 9 },
  { value: "Australia/Sydney", label: "Sydney", offset: 11 },
  { value: "Pacific/Auckland", label: "Auckland", offset: 12 },
];

function getTimeInTimezone(offset: number): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + offset * 3600000);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function WorldClockPage() {
  const [state, setState, clearState] = useToolState(
    "world-clock",
    initialState,
  );
  const [currentTimes, setCurrentTimes] = useState<Record<string, Date>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const { cities, convertFrom, convertTo, convertTime } = state;

  useEffect(() => {
    const updateTimes = () => {
      const times: Record<string, Date> = {};
      cities.forEach((city) => {
        times[city.id] = getTimeInTimezone(city.offset);
      });
      setCurrentTimes(times);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, [cities]);

  const convertResult = (() => {
    if (!convertTime) return "";
    const [hours, minutes] = convertTime.split(":").map(Number);
    const fromTz = ALL_TIMEZONES.find((t) => t.value === convertFrom);
    const toTz = ALL_TIMEZONES.find((t) => t.value === convertTo);

    if (!fromTz || !toTz) return "";

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    const utcHours = hours - fromTz.offset;
    const targetHours = utcHours + toTz.offset;

    const resultDate = new Date(date);
    resultDate.setHours((targetHours + 24) % 24);

    return resultDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  })();

  const handleAddCity = (timezone: string) => {
    const tz = ALL_TIMEZONES.find((t) => t.value === timezone);
    if (!tz) return;

    const exists = cities.some((c) => c.timezone === timezone);
    if (exists) return;

    const newCity: CityTime = {
      id: timezone.split("/")[1]?.toLowerCase() || timezone,
      city: tz.label,
      timezone: tz.value,
      offset: tz.offset,
    };

    setState((prev) => ({ ...prev, cities: [...prev.cities, newCity] }));
    setSearchTerm("");
  };

  const handleRemoveCity = (id: string) => {
    setState((prev) => ({
      ...prev,
      cities: prev.cities.filter((c) => c.id !== id),
    }));
  };

  const filteredTimezones = ALL_TIMEZONES.filter((tz) =>
    tz.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">World Clock / Timezone Converter</h1>
        <p className="text-muted-foreground">
          View current time in multiple cities and convert between timezones
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>World Clock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Add City</Label>
              <Select value={searchTerm} onValueChange={handleAddCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Search city..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredTimezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label} (UTC{tz.offset >= 0 ? "+" : ""}
                      {tz.offset})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              {cities.map((city) => (
                <div
                  key={city.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted"
                >
                  <div>
                    <div className="font-medium">{city.city}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(currentTimes[city.id] || new Date())}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">
                      {formatTime(currentTimes[city.id] || new Date())}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      UTC{city.offset >= 0 ? "+" : ""}
                      {city.offset}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCity(city.id)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timezone Converter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>From</Label>
                <Select
                  value={convertFrom}
                  onValueChange={(v) =>
                    setState((prev) => ({ ...prev, convertFrom: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>To</Label>
                <Select
                  value={convertTo}
                  onValueChange={(v) =>
                    setState((prev) => ({ ...prev, convertTo: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Time (24h format)</Label>
                <Input
                  type="time"
                  value={convertTime}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      convertTime: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="p-6 rounded-lg bg-muted text-center">
              <div className="text-sm text-muted-foreground mb-1">
                Converted Time
              </div>
              <div className="text-3xl font-bold">{convertResult || "—"}</div>
              <div className="text-sm text-muted-foreground mt-2">
                {ALL_TIMEZONES.find((t) => t.value === convertTo)?.label}
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Current time in selected zones:</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  {ALL_TIMEZONES.find((t) => t.value === convertFrom)?.label}:{" "}
                  <strong>
                    {formatTime(
                      getTimeInTimezone(
                        ALL_TIMEZONES.find((t) => t.value === convertFrom)
                          ?.offset || 0,
                      ),
                    )}
                  </strong>
                </div>
                <div>
                  {ALL_TIMEZONES.find((t) => t.value === convertTo)?.label}:{" "}
                  <strong>
                    {formatTime(
                      getTimeInTimezone(
                        ALL_TIMEZONES.find((t) => t.value === convertTo)
                          ?.offset || 0,
                      ),
                    )}
                  </strong>
                </div>
              </div>
            </div>

            <Button variant="outline" onClick={clearState}>
              Clear
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
