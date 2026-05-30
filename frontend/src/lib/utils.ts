import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCalories(cal: number): string {
  return Math.round(cal).toLocaleString();
}

export function formatMacro(g: number): string {
  return `${Math.round(g)}g`;
}

export function formatQuantity(g: number): string {
  if (g >= 1000) return `${(g / 1000).toFixed(1)}kg`;
  return `${Math.round(g)}g`;
}

export function getScoreColor(score: number): string {
  if (score >= 0.8) return "text-emerald-600";
  if (score >= 0.5) return "text-yellow-600";
  return "text-red-600";
}

export function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-600" };
  if (bmi < 25)   return { label: "Normal",       color: "text-emerald-600" };
  if (bmi < 30)   return { label: "Overweight",   color: "text-yellow-600" };
  return              { label: "Obese",        color: "text-red-600" };
}
