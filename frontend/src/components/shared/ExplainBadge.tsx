import { cn } from "@/lib/utils";
import { CONDITION_COLORS } from "@/lib/constants";

interface ExplainBadgeProps {
  text: string;
  relevance?: string;
  variant?: "positive" | "caution" | "neutral";
  className?: string;
}

export function ExplainBadge({ text, relevance, variant = "positive", className }: ExplainBadgeProps) {
  const colors = {
    positive: "bg-emerald-50 text-emerald-700 border-emerald-200",
    caution:  "bg-amber-50 text-amber-700 border-amber-200",
    neutral:  "bg-gray-50 text-gray-600 border-gray-200",
  };

  return (
    <span
      className={cn(
        "metric-chip",
        colors[variant],
        className
      )}
      title={relevance ? `Relevant for: ${relevance}` : undefined}
    >
      {variant === "positive" ? "✓" : variant === "caution" ? "⚠" : "·"} {text}
    </span>
  );
}

interface PolicyBadgeProps {
  type: "ENFORCE" | "LIMIT" | "PREFER";
  text: string;
}

export function PolicyBadge({ type, text }: PolicyBadgeProps) {
  const config = {
    ENFORCE: { icon: "🚫", cls: "policy-badge-enforce", label: "BLOCK" },
    LIMIT:   { icon: "⚠️", cls: "policy-badge-limit",   label: "LIMIT" },
    PREFER:  { icon: "✓",  cls: "policy-badge-prefer",  label: "PREFER" },
  }[type];

  return (
    <span className={cn("policy-badge", config.cls)}>
      {config.icon} <span className="font-bold">{config.label}</span> {text}
    </span>
  );
}
