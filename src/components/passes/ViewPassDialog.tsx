import { format } from "date-fns";
import { Home, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

import { Pass } from "@/types/pass";

interface ViewPassDialogProps {
  pass: Pass | null;
  onClose: () => void;
  fallbackName?: string;
}

export function ViewPassDialog({ pass, onClose, fallbackName }: ViewPassDialogProps) {
  return (
    <Dialog open={!!pass} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {pass && (
          <>
            <div className="overflow-hidden rounded-lg border-2 border-stone-200 bg-[#fff] p-0 shadow-sm">
              <div className={`p-4 ${pass.pass_type === "home_vacation" ? "bg-[#ffb6c1]" : "bg-[#bbf7d0]"}`}>
                {/* Header */}
                <div className="relative border-b border-stone-300 pb-3 text-center">
                  <h2 className="text-lg font-bold tracking-tight text-stone-800">GMR INSTITUTE OF TECHNOLOGY</h2>
                  <p className={`text-xs font-bold uppercase tracking-widest ${pass.pass_type === "home_vacation" ? "text-pink-600" : "text-green-600"}`}>
                    {pass.pass_type === "home_vacation" ? "PINKPASS FOR HOSTLERS" : "OUTING PASS FOR HOSTLERS"}
                  </p>
                  <p className="mt-1 text-[10px] text-stone-500">
                    GMR Nagar, RAJAM-532 127, 1800-129-118
                  </p>
                </div>

                {/* Content */}
                <div className="mt-4 space-y-2 font-mono text-sm uppercase text-stone-800">
                  <div className="flex justify-between py-1">
                    <span className="text-stone-500">Student Name:</span>
                    <span className="font-bold">{pass.profiles?.full_name || fallbackName}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-500">Roll No:</span>
                    <span className="font-bold">{pass.profiles?.jntu_number || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-500">Branch:</span>
                    <span className="font-bold">{pass.profiles?.branch || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-500">Year:</span>
                    <span className="font-bold">{pass.profiles?.year || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-500">Block Name:</span>
                    <span className="font-bold">{pass.profiles?.hostel_name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-500">Room No:</span>
                    <span className="font-bold">{pass.profiles?.room_number || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-500">Iss. DateTime:</span>
                    <span className="font-bold">{format(new Date(pass.created_at), "dd/MM/yyyy h:mm:ss a")}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-500">Out DateTime:</span>
                    <span className="font-bold">{format(new Date(pass.from_date), "dd/MM/yyyy h:mm:ss a")}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 flex flex-col items-center justify-center border-t border-stone-200 pt-3 opacity-50">
                  <p className="text-[10px] text-stone-400 font-mono tracking-tighter uppercase">
                    Pass Validation Required at Gate
                  </p>
                  <p className="mt-1 text-[8px] text-stone-400">Pass ID: {pass.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <div className="flex p-3 bg-stone-50 border-t">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full h-8 text-xs font-bold uppercase tracking-widest text-stone-600 border-stone-300 hover:bg-stone-100"
                >
                  Close Pass
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
