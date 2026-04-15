import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, User, Users } from "lucide-react";

export type ActivityFilterType = "all" | "mine" | "others";

interface ActivityFilterProps {
  filter: ActivityFilterType;
  onFilterChange: (filter: ActivityFilterType) => void;
}

export const ActivityFilter = ({ filter, onFilterChange }: ActivityFilterProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
          {filter !== "all" && (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
              {filter === "mine" ? "My logs" : "Others"}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-card border-border">
        <DropdownMenuLabel>Filter Activity</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={filter === "all"}
          onCheckedChange={() => onFilterChange("all")}
        >
          <Users className="h-4 w-4 mr-2" />
          All Activity
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={filter === "mine"}
          onCheckedChange={() => onFilterChange("mine")}
        >
          <User className="h-4 w-4 mr-2" />
          My Updates
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={filter === "others"}
          onCheckedChange={() => onFilterChange("others")}
        >
          <Users className="h-4 w-4 mr-2" />
          Others' Updates
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
