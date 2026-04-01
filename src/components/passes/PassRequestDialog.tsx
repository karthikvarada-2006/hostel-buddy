import { useState } from "react";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateTimePicker } from "./DateTimePicker";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pass } from "@/types/pass";
import { useEffect } from "react";

const passRequestSchema = z.object({
  pass_type: z.enum(["outing", "home_vacation"]),
  destination: z
    .string()
    .min(1, "Destination is required")
    .max(200, "Destination must be less than 200 characters"),
  from_date: z.date({
    required_error: "Start date and time is required",
  }),
  to_date: z.date({
    required_error: "End date and time is required",
  }),
  reason: z
    .string()
    .min(1, "Reason is required")
    .max(500, "Reason must be less than 500 characters"),
}).refine(
  (data) => data.to_date >= data.from_date,
  {
    message: "End date must be after or equal to start date",
    path: ["to_date"],
  }
).refine(
  (data) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - 5); // Allow 5 min buffer
    return data.from_date >= now;
  },
  {
    message: "Start date cannot be in the past",
    path: ["from_date"],
  }
);

type FormData = {
  pass_type: "outing" | "home_vacation";
  destination: string;
  from_date: Date | undefined;
  to_date: Date | undefined;
  reason: string;
};

type FormErrors = {
  pass_type?: string;
  destination?: string;
  from_date?: string;
  to_date?: string;
  reason?: string;
};

interface PassRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  onSuccess: () => void;
  editingPass?: Pass | null;
}

export function PassRequestDialog({
  open,
  onOpenChange,
  profileId,
  onSuccess,
  editingPass,
}: PassRequestDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    pass_type: "outing",
    destination: "",
    from_date: undefined,
    to_date: undefined,
    reason: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (editingPass && open) {
      setFormData({
        pass_type: editingPass.pass_type as "outing" | "home_vacation",
        destination: editingPass.destination,
        from_date: new Date(editingPass.from_date),
        to_date: new Date(editingPass.to_date),
        reason: editingPass.reason,
      });
    } else if (!open) {
      resetForm();
    }
  }, [editingPass, open]);

  const resetForm = () => {
    setFormData({
      pass_type: "outing",
      destination: "",
      from_date: undefined,
      to_date: undefined,
      reason: "",
    });
    setErrors({});
  };

  const handleSubmit = async () => {
    // Clear previous errors
    setErrors({});

    // Validate with Zod
    const result = passRequestSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormErrors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingPass) {
        const { error } = await supabase
          .from("passes")
          .update({
            pass_type: formData.pass_type,
            reason: formData.reason.trim(),
            destination: formData.destination.trim(),
            from_date: formData.from_date!.toISOString(),
            to_date: formData.to_date!.toISOString(),
          })
          .eq("id", editingPass.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("passes").insert({
          student_id: profileId,
          pass_type: formData.pass_type,
          reason: formData.reason.trim(),
          destination: formData.destination.trim(),
          from_date: formData.from_date!.toISOString(),
          to_date: formData.to_date!.toISOString(),
        });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Pass request ${editingPass ? "updated" : "submitted"} successfully.`,
      });
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingPass ? "Edit Pass Request" : "Request Pass"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Pass Type</Label>
            <Select
              value={formData.pass_type}
              onValueChange={(value: "outing" | "home_vacation") =>
                setFormData({ ...formData, pass_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outing">Outing Pass</SelectItem>
                <SelectItem value="home_vacation">
                  Home Vacation Pass (Pink Pass)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              placeholder="Where are you going?"
              value={formData.destination}
              onChange={(e) =>
                setFormData({ ...formData, destination: e.target.value })
              }
              maxLength={200}
              className={errors.destination ? "border-destructive" : ""}
            />
            {errors.destination && (
              <p className="text-sm text-destructive">{errors.destination}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DateTimePicker
              label="From"
              id="from_date"
              value={formData.from_date}
              onChange={(date) => setFormData({ ...formData, from_date: date })}
              error={errors.from_date}
            />
            <DateTimePicker
              label="To"
              id="to_date"
              value={formData.to_date}
              onChange={(date) => setFormData({ ...formData, to_date: date })}
              minDate={formData.from_date}
              error={errors.to_date}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Why do you need this pass?"
              rows={3}
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              maxLength={500}
              className={errors.reason ? "border-destructive" : ""}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.reason.length}/500 characters
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingPass ? "Update Request" : "Submit Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
