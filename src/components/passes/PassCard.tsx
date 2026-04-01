import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Home,
  MapPin,
  Trash2,
  Edit2,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Pass } from "@/types/pass";

interface PassCardProps {
  pass: Pass;
  isAdmin: boolean;
  onEdit?: (pass: Pass) => void;
  onView?: (pass: Pass) => void;
  onDelete?: (id: string) => void;
  index: number;
}

export function PassCard({ pass, isAdmin, onEdit, onView, onDelete, index }: PassCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "pending":
        return "status-pending";
      case "approved":
        return "status-approved";
      case "rejected":
        return "status-rejected";
      default:
        return "";
    }
  };

  const handleClick = () => {
    if (isAdmin && onEdit) {
      onEdit(pass);
    } else if (pass.status === "approved" && onView) {
      onView(pass);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(pass.id);
    }
  };

  return (
    <Card
      className={`card-shadow cursor-pointer transition-colors hover:border-primary/30 ${pass.pass_type === "home_vacation" ? "border-l-4 border-l-pink-500" : ""
        }`}
      onClick={handleClick}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {pass.pass_type === "home_vacation" ? (
                <Home className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500 shrink-0" />
              ) : (
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
              )}
              <h3 className="text-sm sm:text-base font-semibold capitalize truncate">
                <span className="text-muted-foreground mr-1 text-xs sm:text-sm">{index + 1}</span>
                {pass.pass_type.replace("_", " ")} Pass
              </h3>
              <Badge className={cn("text-[10px] sm:text-xs", getStatusClass(pass.status))}>
                {getStatusIcon(pass.status)}
                <span className="ml-1 capitalize">{pass.status}</span>
              </Badge>
            </div>
            {isAdmin && pass.profiles && (
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground truncate">
                By: {pass.profiles.full_name}
                {pass.profiles.room_number &&
                  ` • Room ${pass.profiles.room_number}`}
              </p>
            )}
            <div className="mt-2 space-y-1 text-xs sm:text-sm">
              <p className="flex gap-1">
                <strong className="shrink-0">To:</strong>
                <span className="truncate">{pass.destination}</span>
              </p>
              <p className="flex gap-1 flex-wrap sm:flex-nowrap">
                <strong className="shrink-0">Duration:</strong>{" "}
                <span className="text-muted-foreground">
                  {format(new Date(pass.from_date), "MMM d, h:mm a")} -{" "}
                  {format(new Date(pass.to_date), "MMM d, h:mm a")}
                </span>
              </p>
              <p className="text-muted-foreground line-clamp-2 sm:line-clamp-none italic">"{pass.reason}"</p>
            </div>
            {pass.admin_comment && (
              <div
                className={`mt-2 rounded-lg p-2 ${pass.status === "approved"
                  ? "bg-green-50 dark:bg-green-900/20"
                  : "bg-red-50 dark:bg-red-900/20"
                  }`}
              >
                <p
                  className={`text-xs sm:text-sm ${pass.status === "approved"
                    ? "text-green-700 dark:text-green-300"
                    : "text-red-700 dark:text-red-300"
                    }`}
                >
                  <strong className="shrink-0">Admin:</strong> {pass.admin_comment}
                </p>
              </div>
            )}
          </div>
          <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[10px] sm:text-xs flex-1 sm:flex-none"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(pass);
                }}
              >
                <Edit2 className="mr-1 h-3.5 w-3.5" />
                {pass.status === "pending" ? "Review" : "Edit"}
              </Button>
            )}
            {pass.status === "approved" && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs flex-1 sm:flex-none"
                onClick={(e) => {
                  e.stopPropagation();
                  onView?.(pass);
                }}
              >
                <Download className="mr-1 h-3.5 w-3.5" />
                View Pass
              </Button>
            )}
            {!isAdmin && pass.status === "pending" && (
              <div className="flex gap-2 flex-1 sm:flex-none">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[10px] sm:text-xs text-muted-foreground hover:text-primary flex-1 sm:flex-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(pass);
                  }}
                >
                  <Edit2 className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[10px] sm:text-xs text-muted-foreground hover:text-destructive flex-1 sm:flex-none"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
