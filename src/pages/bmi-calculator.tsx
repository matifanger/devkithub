/**
 * BMI Calculator
 *
 * Calculates Body Mass Index (BMI) and provides health category classification.
 *
 * Features:
 * - BMI calculation from height and weight
 * - Support for Metric (kg/cm) and Imperial (lb/ft+in) units
 * - Visual category indicator
 * - Detailed health information
 * - Normal BMI range reference
 *
 * How to use:
 * 1. Select unit system (Metric or Imperial)
 * 2. Enter height and weight
 * 3. View your BMI result and category
 * 4. Check the health information for guidance
 */

import React, { useMemo } from "react";
import { ToolClearButton } from "../components/tool-actions";
import {
  ToolPageContainer,
  ToolPageHeader,
} from "../components/tool-page-layout";
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

type UnitSystem = "metric" | "imperial";

interface BmiCalculatorState {
  unitSystem: UnitSystem;
  heightCm: string;
  weightKg: string;
  heightFt: string;
  heightIn: string;
  weightLb: string;
}

const initialState: BmiCalculatorState = {
  unitSystem: "metric",
  heightCm: "",
  weightKg: "",
  heightFt: "",
  heightIn: "",
  weightLb: "",
};

interface BmiCategory {
  name: string;
  min: number;
  max: number;
  color: string;
  description: string;
}

const BMI_CATEGORIES: BmiCategory[] = [
  {
    name: "Underweight",
    min: 0,
    max: 18.5,
    color: "bg-blue-500",
    description: "You may need to gain weight",
  },
  {
    name: "Normal weight",
    min: 18.5,
    max: 24.9,
    color: "bg-green-500",
    description: "Great! Maintain your weight",
  },
  {
    name: "Overweight",
    min: 25,
    max: 29.9,
    color: "bg-yellow-500",
    description: "Consider lifestyle changes",
  },
  {
    name: "Obesity (Class I)",
    min: 30,
    max: 34.9,
    color: "bg-orange-500",
    description: "Consult a healthcare provider",
  },
  {
    name: "Obesity (Class II)",
    min: 35,
    max: 39.9,
    color: "bg-red-500",
    description: "Medical attention recommended",
  },
  {
    name: "Obesity (Class III)",
    min: 40,
    max: 100,
    color: "bg-red-700",
    description: "Seek medical attention immediately",
  },
];

function calculateBMI(weight: number, height: number): number {
  if (weight <= 0 || height <= 0) return 0;
  return weight / (height * height);
}

function calculateImperialBMI(
  weightLb: number,
  heightFt: number,
  heightIn: number,
): number {
  if (weightLb <= 0 || heightFt * 12 + heightIn <= 0) return 0;
  const weightKg = weightLb * 0.453592;
  const heightM = (heightFt * 12 + heightIn) * 0.0254;
  return weightKg / (heightM * heightM);
}

function getBMICategory(bmi: number): BmiCategory {
  return (
    BMI_CATEGORIES.find((cat) => bmi >= cat.min && bmi < cat.max) ||
    BMI_CATEGORIES[BMI_CATEGORIES.length - 1]
  );
}

function getWeightRange(
  bmi: number,
  height: number,
): { min: number; max: number } {
  const minWeight = 18.5 * height * height;
  const maxWeight = 24.9 * height * height;
  return {
    min: Math.round(minWeight * 10) / 10,
    max: Math.round(maxWeight * 10) / 10,
  };
}

function getImperialWeightRange(
  bmi: number,
  heightFt: number,
  heightIn: number,
): { min: number; max: number } {
  const totalInches = heightFt * 12 + heightIn;
  const heightM = totalInches * 0.0254;
  const minWeightKg = 18.5 * heightM * heightM;
  const maxWeightKg = 24.9 * heightM * heightM;
  return {
    min: Math.round(minWeightKg * 2.20462 * 10) / 10,
    max: Math.round(maxWeightKg * 2.20462 * 10) / 10,
  };
}

export function BMICalculatorPage() {
  const [state, setState, clearState] = useToolState(
    "bmi-calculator",
    initialState,
  );

  const { unitSystem, heightCm, weightKg, heightFt, heightIn, weightLb } =
    state;

  const bmi = useMemo(() => {
    if (unitSystem === "metric") {
      const h = parseFloat(heightCm) / 100;
      const w = parseFloat(weightKg);
      if (h > 0 && w > 0) return calculateBMI(w, h);
    } else {
      const ft = parseFloat(heightFt) || 0;
      const inc = parseFloat(heightIn) || 0;
      const lb = parseFloat(weightLb);
      if ((ft > 0 || inc > 0) && lb > 0)
        return calculateImperialBMI(lb, ft, inc);
    }
    return 0;
  }, [unitSystem, heightCm, weightKg, heightFt, heightIn, weightLb]);

  const category = useMemo(() => {
    if (bmi > 0) return getBMICategory(bmi);
    return null;
  }, [bmi]);

  const weightRange = useMemo(() => {
    if (unitSystem === "metric") {
      const h = parseFloat(heightCm) / 100;
      if (h > 0) return getWeightRange(22, h);
    } else {
      const ft = parseFloat(heightFt) || 0;
      const inc = parseFloat(heightIn) || 0;
      if (ft > 0 || inc > 0) return getImperialWeightRange(22, ft, inc);
    }
    return null;
  }, [unitSystem, heightCm, heightFt, heightIn]);

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="BMI Calculator"
        description="Calculate your Body Mass Index and check your health category"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Unit System</Label>
              <Select
                value={unitSystem}
                onValueChange={(v) =>
                  setState((prev) => ({ ...prev, unitSystem: v as UnitSystem }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric">Metric (kg, cm)</SelectItem>
                  <SelectItem value="imperial">Imperial (lb, ft+in)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {unitSystem === "metric" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Height (cm)</Label>
                  <Input
                    type="number"
                    value={heightCm}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        heightCm: e.target.value,
                      }))
                    }
                    placeholder="175"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    value={weightKg}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        weightKg: e.target.value,
                      }))
                    }
                    placeholder="70"
                    min="0"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Height</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      value={heightFt}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          heightFt: e.target.value,
                        }))
                      }
                      placeholder="5"
                      min="0"
                    />
                    <Input
                      type="number"
                      value={heightIn}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          heightIn: e.target.value,
                        }))
                      }
                      placeholder="9"
                      min="0"
                      max="11"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    feet + inches
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Weight (lb)</Label>
                  <Input
                    type="number"
                    value={weightLb}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        weightLb: e.target.value,
                      }))
                    }
                    placeholder="154"
                    min="0"
                  />
                </div>
              </>
            )}

            <ToolClearButton onClear={clearState} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {bmi > 0 ? (
              <>
                <div className="text-center">
                  <div className="text-6xl font-bold mb-2">
                    {bmi.toFixed(1)}
                  </div>
                  <div className="text-muted-foreground">Your BMI</div>
                </div>

                {category && (
                  <div
                    className={`p-4 rounded-lg ${category.color} text-white text-center`}
                  >
                    <div className="text-xl font-bold">{category.name}</div>
                    <div className="text-sm mt-1">{category.description}</div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Underweight</span>
                    <span className="text-muted-foreground">Normal</span>
                    <span className="text-muted-foreground">Overweight</span>
                    <span className="text-muted-foreground">Obese</span>
                  </div>
                  <div className="h-4 rounded-full bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 via-orange-500 to-red-700 relative">
                    {bmi > 0 && (
                      <div
                        className="absolute w-4 h-4 bg-white border-2 border-black rounded-full top-0 transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                          left: `${Math.min(Math.max((bmi / 40) * 100, 0), 100)}%`,
                        }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0</span>
                    <span>18.5</span>
                    <span>25</span>
                    <span>30</span>
                    <span>40</span>
                  </div>
                </div>

                {weightRange && (
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-sm text-muted-foreground mb-1">
                      Recommended weight for your height
                    </div>
                    <div className="text-lg font-bold">
                      {weightRange.min} - {weightRange.max}{" "}
                      {unitSystem === "metric" ? "kg" : "lb"}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Enter your height and weight to calculate BMI
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolPageContainer>
  );
}
