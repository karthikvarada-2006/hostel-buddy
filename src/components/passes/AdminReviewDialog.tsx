import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Loader2, XCircle, CheckCircle, Home, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PassProfile {
  full_name: string;
  room_number: string | null;
  hostel_name: string | null;
}

interface Pass {
  id: string;
  pass_type: "outing" | "home_vacation";
  reason: string;
  destination: string;
  from_date: string;
  to_date: string;
  status: "pending" | "approved" | "rejected";
  admin_comment: string | null;
  created_at: string;
  profiles?: PassProfile;
}

interface AdminReviewDialogProps {
  pass: Pass | null;
  onClose: () => void;
  adminProfileId: string;
  onSuccess: () => void;
  onDelete?: (id: string) => void;
}

export function AdminReviewDialog({
  pass,
  onClose,
  adminProfileId,
  onSuccess,
  onDelete,
}: AdminReviewDialogProps) {
  const { toast } = useToast();
  const [adminComment, setAdminComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (pass) {
      setAdminComment(pass.admin_comment || "");
    }
  }, [pass]);

  const handleUpdatePass = async (status: "approved" | "rejected") => {
    if (!pass) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("passes")
        .update({
          status,
          admin_comment: adminComment || null,
          approved_by: adminProfileId,
        })
        .eq("id", pass.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update pass.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Pass ${status} successfully.`,
          variant: "success",
        });
        setAdminComment("");
        onClose();
        onSuccess();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!pass || !onDelete) return;
    onDelete(pass.id);
    onClose();
  };

  const handleClose = () => {
    setAdminComment("");
    onClose();
  };

  return (
    <Dialog open={!!pass} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {pass?.status === "pending" ? "Review Pass Request" : "Edit Pass Review"}
          </DialogTitle>
        </DialogHeader>
        {pass && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center gap-2">
                {pass.pass_type === "home_vacation" ? (
                  <Home className="h-5 w-5 text-pink-500" />
                ) : (
                  <MapPin className="h-5 w-5 text-primary" />
                )}
                <h4 className="font-semibold capitalize">
                  {pass.pass_type.replace("_", " ")} Pass
                </h4>
              </div>
              {pass.profiles && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Student: {pass.profiles.full_name}
                  {pass.profiles.room_number &&
                    ` • Room ${pass.profiles.room_number}`}
                </p>
              )}
              <div className="mt-3 space-y-1 text-sm">
                <p>
                  <strong>Destination:</strong> {pass.destination}
                </p>
                <p>
                  <strong>Duration:</strong>{" "}
                  {format(new Date(pass.from_date), "MMM d, h:mm a")} -{" "}
                  {format(new Date(pass.to_date), "MMM d, h:mm a")}
                </p>
                <p>
                  <strong>Reason:</strong> {pass.reason}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Comment (Optional)</Label>
              <Textarea
                id="comment"
                placeholder="Add a comment..."
                rows={2}
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleUpdatePass("rejected")}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                {pass.status === "rejected" ? "Reject (Update)" : "Reject"}
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "transition-all duration-200",
                  "bg-green-600 text-white hover:bg-green-700 border-green-600 shadow-[0_0_15px_rgba(22,163,74,0.4)]"
                )}
                onClick={() => handleUpdatePass("approved")}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                {pass.status === "approved" ? "Approve (Update)" : "Approve"}
              </Button>
              {onDelete && (
                <Button
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
