import React from "react";
import { Heart, MapPin, PlaneLanding, Search, Calendar, LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: "heart" | "map" | "plane" | "search" | "calendar";
  action?: React.ReactNode;
}

const iconComponents: Record<string, React.ReactNode> = {
  heart: <Heart className="w-16 h-16 text-gray-300" />,
  map: <MapPin className="w-16 h-16 text-gray-300" />,
  plane: <PlaneLanding className="w-16 h-16 text-gray-300" />,
  search: <Search className="w-16 h-16 text-gray-300" />,
  calendar: <Calendar className="w-16 h-16 text-gray-300" />,
};

export function EmptyState({ 
  title, 
  description, 
  icon = "search", 
  action 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed rounded-lg border-gray-300 bg-gray-50">
      <div className="text-center max-w-md">
        <div className="mb-4">
          {iconComponents[icon]}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{description}</p>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}