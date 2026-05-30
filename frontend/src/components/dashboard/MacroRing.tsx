"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { MACRO_COLORS } from "@/lib/constants";
import { formatCalories } from "@/lib/utils";

interface MacroRingProps {
  calories: number;
  targetCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2 text-sm">
        <div className="font-bold text-gray-900">{payload[0].name}</div>
        <div className="text-gray-500">{payload[0].value}g</div>
      </div>
    );
  }
  return null;
};

export function MacroRing({
  calories, targetCalories, protein, carbs, fat,
  targetProtein, targetCarbs, targetFat,
}: MacroRingProps) {
  const data = [
    { name: "Protein", value: Math.round(protein), color: MACRO_COLORS.protein },
    { name: "Carbs",   value: Math.round(carbs),   color: MACRO_COLORS.carbs },
    { name: "Fat",     value: Math.round(fat),      color: MACRO_COLORS.fat },
  ];

  const caloriePct = targetCalories > 0 ? Math.min((calories / targetCalories) * 100, 100) : 0;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Ring chart */}
      <div className="relative w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={88}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-2xl font-black text-gray-900">{formatCalories(calories)}</div>
          <div className="text-xs text-gray-400 font-medium">kcal</div>
          <div className="text-xs text-gray-500 mt-0.5">{Math.round(caloriePct)}% of goal</div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {[
          { label: "Protein", value: protein, color: MACRO_COLORS.protein, target: targetProtein },
          { label: "Carbs",   value: carbs,   color: MACRO_COLORS.carbs,   target: targetCarbs },
          { label: "Fat",     value: fat,      color: MACRO_COLORS.fat,     target: targetFat },
        ].map((m) => (
          <div key={m.label} className="text-center">
            <div className="text-lg font-black" style={{ color: m.color }}>{Math.round(m.value)}g</div>
            <div className="text-xs text-gray-500 font-medium">{m.label}</div>
            {m.target && (
              <div className="text-xs text-gray-400 mt-0.5">/ {Math.round(m.target)}g</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
