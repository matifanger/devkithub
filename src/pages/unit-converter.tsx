/**
 * Unit Converter
 *
 * Converts values between different units of measurement.
 *
 * Features:
 * - Length conversion (meters, feet, inches, miles, km, etc.)
 * - Weight conversion (kg, lbs, oz, grams, etc.)
 * - Temperature conversion (Celsius, Fahrenheit, Kelvin)
 * - Volume conversion (liters, gallons, ml, etc.)
 * - Area conversion (sq meters, sq feet, acres, etc.)
 * - Speed conversion (mph, km/h, m/s, knots)
 * - Time conversion (seconds, minutes, hours, days)
 * - Digital storage (bytes, KB, MB, GB, TB)
 *
 * How to use:
 * 1. Select the category of conversion
 * 2. Enter the value to convert
 * 3. Select the source unit
 * 4. Select the target unit
 * 5. View the converted result
 */

import React, { useMemo } from "react";
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

type Category =
  | "length"
  | "weight"
  | "temperature"
  | "volume"
  | "area"
  | "speed"
  | "time"
  | "digital";

interface Unit {
  value: string;
  label: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
}

interface UnitConverterState {
  category: Category;
  inputValue: string;
  fromUnit: string;
  toUnit: string;
}

const initialState: UnitConverterState = {
  category: "length",
  inputValue: "",
  fromUnit: "meter",
  toUnit: "kilometer",
};

const UNITS: Record<Category, Unit[]> = {
  length: [
    {
      value: "meter",
      label: "Meters (m)",
      toBase: (v) => v,
      fromBase: (v) => v,
    },
    {
      value: "kilometer",
      label: "Kilometers (km)",
      toBase: (v) => v * 1000,
      fromBase: (v) => v / 1000,
    },
    {
      value: "centimeter",
      label: "Centimeters (cm)",
      toBase: (v) => v / 100,
      fromBase: (v) => v * 100,
    },
    {
      value: "millimeter",
      label: "Millimeters (mm)",
      toBase: (v) => v / 1000,
      fromBase: (v) => v * 1000,
    },
    {
      value: "mile",
      label: "Miles (mi)",
      toBase: (v) => v * 1609.344,
      fromBase: (v) => v / 1609.344,
    },
    {
      value: "yard",
      label: "Yards (yd)",
      toBase: (v) => v * 0.9144,
      fromBase: (v) => v / 0.9144,
    },
    {
      value: "foot",
      label: "Feet (ft)",
      toBase: (v) => v * 0.3048,
      fromBase: (v) => v / 0.3048,
    },
    {
      value: "inch",
      label: "Inches (in)",
      toBase: (v) => v * 0.0254,
      fromBase: (v) => v / 0.0254,
    },
  ],
  weight: [
    {
      value: "kilogram",
      label: "Kilograms (kg)",
      toBase: (v) => v,
      fromBase: (v) => v,
    },
    {
      value: "gram",
      label: "Grams (g)",
      toBase: (v) => v / 1000,
      fromBase: (v) => v * 1000,
    },
    {
      value: "milligram",
      label: "Milligrams (mg)",
      toBase: (v) => v / 1000000,
      fromBase: (v) => v * 1000000,
    },
    {
      value: "pound",
      label: "Pounds (lb)",
      toBase: (v) => v * 0.453592,
      fromBase: (v) => v / 0.453592,
    },
    {
      value: "ounce",
      label: "Ounces (oz)",
      toBase: (v) => v * 0.0283495,
      fromBase: (v) => v / 0.0283495,
    },
    {
      value: "ton",
      label: "Metric Tons (t)",
      toBase: (v) => v * 1000,
      fromBase: (v) => v / 1000,
    },
  ],
  temperature: [
    {
      value: "celsius",
      label: "Celsius (°C)",
      toBase: (v) => v,
      fromBase: (v) => v,
    },
    {
      value: "fahrenheit",
      label: "Fahrenheit (°F)",
      toBase: (v) => ((v - 32) * 5) / 9,
      fromBase: (v) => (v * 9) / 5 + 32,
    },
    {
      value: "kelvin",
      label: "Kelvin (K)",
      toBase: (v) => v - 273.15,
      fromBase: (v) => v + 273.15,
    },
  ],
  volume: [
    {
      value: "liter",
      label: "Liters (L)",
      toBase: (v) => v,
      fromBase: (v) => v,
    },
    {
      value: "milliliter",
      label: "Milliliters (mL)",
      toBase: (v) => v / 1000,
      fromBase: (v) => v * 1000,
    },
    {
      value: "gallon",
      label: "Gallons (gal)",
      toBase: (v) => v * 3.78541,
      fromBase: (v) => v / 3.78541,
    },
    {
      value: "quart",
      label: "Quarts (qt)",
      toBase: (v) => v * 0.946353,
      fromBase: (v) => v / 0.946353,
    },
    {
      value: "pint",
      label: "Pints (pt)",
      toBase: (v) => v * 0.473176,
      fromBase: (v) => v / 0.473176,
    },
    {
      value: "cup",
      label: "Cups",
      toBase: (v) => v * 0.236588,
      fromBase: (v) => v / 0.236588,
    },
  ],
  area: [
    {
      value: "sqmeter",
      label: "Square Meters (m²)",
      toBase: (v) => v,
      fromBase: (v) => v,
    },
    {
      value: "sqkilometer",
      label: "Square Kilometers (km²)",
      toBase: (v) => v * 1000000,
      fromBase: (v) => v / 1000000,
    },
    {
      value: "sqfoot",
      label: "Square Feet (ft²)",
      toBase: (v) => v * 0.092903,
      fromBase: (v) => v / 0.092903,
    },
    {
      value: "sqinch",
      label: "Square Inches (in²)",
      toBase: (v) => v * 0.00064516,
      fromBase: (v) => v / 0.00064516,
    },
    {
      value: "acre",
      label: "Acres",
      toBase: (v) => v * 4046.86,
      fromBase: (v) => v / 4046.86,
    },
    {
      value: "hectare",
      label: "Hectares",
      toBase: (v) => v * 10000,
      fromBase: (v) => v / 10000,
    },
  ],
  speed: [
    {
      value: "mps",
      label: "Meters/Second (m/s)",
      toBase: (v) => v,
      fromBase: (v) => v,
    },
    {
      value: "kmh",
      label: "Kilometers/Hour (km/h)",
      toBase: (v) => v / 3.6,
      fromBase: (v) => v * 3.6,
    },
    {
      value: "mph",
      label: "Miles/Hour (mph)",
      toBase: (v) => v * 0.44704,
      fromBase: (v) => v / 0.44704,
    },
    {
      value: "knots",
      label: "Knots (kn)",
      toBase: (v) => v * 0.514444,
      fromBase: (v) => v / 0.514444,
    },
  ],
  time: [
    {
      value: "second",
      label: "Seconds (s)",
      toBase: (v) => v,
      fromBase: (v) => v,
    },
    {
      value: "millisecond",
      label: "Milliseconds (ms)",
      toBase: (v) => v / 1000,
      fromBase: (v) => v * 1000,
    },
    {
      value: "minute",
      label: "Minutes (min)",
      toBase: (v) => v * 60,
      fromBase: (v) => v / 60,
    },
    {
      value: "hour",
      label: "Hours (h)",
      toBase: (v) => v * 3600,
      fromBase: (v) => v / 3600,
    },
    {
      value: "day",
      label: "Days",
      toBase: (v) => v * 86400,
      fromBase: (v) => v / 86400,
    },
    {
      value: "week",
      label: "Weeks",
      toBase: (v) => v * 604800,
      fromBase: (v) => v / 604800,
    },
  ],
  digital: [
    { value: "byte", label: "Bytes (B)", toBase: (v) => v, fromBase: (v) => v },
    {
      value: "kilobyte",
      label: "Kilobytes (KB)",
      toBase: (v) => v * 1024,
      fromBase: (v) => v / 1024,
    },
    {
      value: "megabyte",
      label: "Megabytes (MB)",
      toBase: (v) => v * 1048576,
      fromBase: (v) => v / 1048576,
    },
    {
      value: "gigabyte",
      label: "Gigabytes (GB)",
      toBase: (v) => v * 1073741824,
      fromBase: (v) => v / 1073741824,
    },
    {
      value: "terabyte",
      label: "Terabytes (TB)",
      toBase: (v) => v * 1099511627776,
      fromBase: (v) => v / 1099511627776,
    },
  ],
};

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "length", label: "Length" },
  { value: "weight", label: "Weight" },
  { value: "temperature", label: "Temperature" },
  { value: "volume", label: "Volume" },
  { value: "area", label: "Area" },
  { value: "speed", label: "Speed" },
  { value: "time", label: "Time" },
  { value: "digital", label: "Digital Storage" },
];

export function UnitConverterPage() {
  const [state, setState, clearState] = useToolState(
    "unit-converter",
    initialState,
  );

  const units = UNITS[state.category];

  const result = useMemo(() => {
    const value = parseFloat(state.inputValue);
    if (isNaN(value)) return "";

    const from = units.find((u) => u.value === state.fromUnit);
    const to = units.find((u) => u.value === state.toUnit);

    if (!from || !to) return "";

    const baseValue = from.toBase(value);
    const convertedValue = to.fromBase(baseValue);

    return convertedValue.toLocaleString(undefined, {
      maximumFractionDigits: 10,
    });
  }, [state.inputValue, state.fromUnit, state.toUnit, units]);

  const handleCategoryChange = (newCategory: Category) => {
    const newUnits = UNITS[newCategory];
    setState({
      ...state,
      category: newCategory,
      fromUnit: newUnits[0].value,
      toUnit: newUnits[1]?.value || newUnits[0].value,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Unit Converter</h1>
        <p className="text-muted-foreground">
          Convert values between different units of measurement
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={state.category}
              onValueChange={(v) => handleCategoryChange(v as Category)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label>From</Label>
              <Input
                type="number"
                value={state.inputValue}
                onChange={(e) =>
                  setState({ ...state, inputValue: e.target.value })
                }
                placeholder="Enter value"
              />
            </div>

            <div className="space-y-2">
              <Label>From Unit</Label>
              <Select
                value={state.fromUnit}
                onValueChange={(v) => setState({ ...state, fromUnit: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>To Unit</Label>
              <Select
                value={state.toUnit}
                onValueChange={(v) => setState({ ...state, toUnit: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-6 rounded-lg bg-muted">
            <div className="text-sm text-muted-foreground mb-1">Result</div>
            <div className="text-3xl font-bold">
              {result || "—"}{" "}
              {units.find((u) => u.value === state.toUnit)?.label.split(" ")[0]}
            </div>
          </div>

          <Button variant="outline" onClick={clearState}>
            Clear
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
