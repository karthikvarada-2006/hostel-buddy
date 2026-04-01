import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, Plus, RefreshCw, Check, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PassCard } from "@/components/passes/PassCard";
import { PassRequestDialog } from "@/components/passes/PassRequestDialog";
import { AdminReviewDialog } from "@/components/passes/AdminReviewDialog";
import { ViewPassDialog } from "@/components/passes/ViewPassDialog";

import { Pass } from "@/types/pass";
import { useToast } from "@/hooks/use-toast";

export default function Passes() {
  const { isAdmin, profile } = useAuth();
  const { toast } = useToast();
  const [passes, setPasses] = useState<Pass[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPass, setEditingPass] = useState<Pass | null>(null);
  const [studentEditingPass, setStudentEditingPass] = useState<Pass | null>(null);
  const [viewingPass, setViewingPass] = useState<Pass | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatus = searchParams.get("status") || "pending";

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPasses();
    setRefreshing(false);
  };

  const handleDeletePass = async (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("passes")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pass request deleted successfully.",
        variant: "success",
      });

      // Auto-refresh the list and counts
      await fetchPasses();
      setDeleteId(null);
    } catch (error: unknown) {
      console.error("Error deleting pass:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete pass request.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPasses();

    // Realtime subscription — auto-refresh on any DB change
    const channel = supabase
      .channel("passes-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "passes" }, () => {
        fetchPasses();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, isAdmin, currentStatus]);

  // Auto-open new pass dialog when navigated with ?new=true (e.g. from voice command)
  useEffect(() => {
    if (!isAdmin && searchParams.get("new") === "true") {
      setDialogOpen(true);
      // Remove the ?new=true param from the URL without re-navigating
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("new");
        return next;
      }, { replace: true });
    }
  }, [searchParams, isAdmin, setSearchParams]);

  // Voice task listener for Passes
  useEffect(() => {
    const handleVoiceTask = async (e: any) => {
      const { action, target, index } = e.detail;
      if (target !== "pass") return;

      const items = passes;
      if (items.length === 0) return;

      let targetItem = items[0];
      if (index === -1) targetItem = items[items.length - 1];
      else if (index > 0 && index < items.length) targetItem = items[index];

      if (!targetItem) return;

      if (action === "delete") {
        handleDeletePass(targetItem.id);
      } else if (isAdmin && (action === "approve" || action === "reject")) {
        // Directly update pass status in DB without opening the dialog
        const newStatus = action === "approve" ? "approved" : "rejected";
        const { error } = await supabase
          .from("passes")
          .update({
            status: newStatus,
            admin_comment: `${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} via voice command`,
            approved_by: profile?.id,
          })
          .eq("id", targetItem.id);
        if (error) {
          toast({ title: "Error", description: `Failed to ${action} pass.`, variant: "destructive" });
        } else {
          toast({ title: "Success", description: `Pass ${newStatus} successfully.`, variant: "success" });
          await fetchPasses();
        }
      } else if (action === "edit") {
        if (isAdmin) {
          setEditingPass(targetItem);
        } else {
          setStudentEditingPass(targetItem);
          setDialogOpen(true);
        }
      }
    };

    window.addEventListener("voicetask", handleVoiceTask);
    return () => window.removeEventListener("voicetask", handleVoiceTask);
  }, [passes, isAdmin, profile?.id]);

  const fetchPasses = async () => {
    let query = supabase
      .from("passes")
      .select(`
        *,
        profiles!passes_student_id_fkey(full_name, room_number, hostel_name, jntu_number, branch, year)
      `)
      .order("created_at", { ascending: false });

    if (!isAdmin && profile?.id) {
      query = query.eq("student_id", profile.id);
    }

    const { data } = await query;
    if (data) {
      const allPasses = data as Pass[];
      setPasses(allPasses.filter(p => p.status === currentStatus));
      setCounts({
        pending: allPasses.filter(p => p.status === "pending").length,
        approved: allPasses.filter(p => p.status === "approved").length,
        rejected: allPasses.filter(p => p.status === "rejected").length,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isAdmin ? "Manage Passes" : "My Passes"}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          {!isAdmin && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Request Pass
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <Button
          variant={currentStatus === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setSearchParams({ status: "pending" })}
          className={`gap-2 rounded-full h-8 px-4 shrink-0 ${currentStatus === "pending" ? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200" : "text-muted-foreground"}`}
        >
          <Clock className="h-4 w-4 shrink-0" />
          Pending ({counts.pending})
        </Button>
        <Button
          variant={currentStatus === "approved" ? "default" : "outline"}
          size="sm"
          onClick={() => setSearchParams({ status: "approved" })}
          className={`gap-2 rounded-full h-8 px-4 shrink-0 ${currentStatus === "approved" ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" : "text-muted-foreground"}`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Approved ({counts.approved})
        </Button>
        <Button
          variant={currentStatus === "rejected" ? "default" : "outline"}
          size="sm"
          onClick={() => setSearchParams({ status: "rejected" })}
          className={`gap-2 rounded-full h-8 px-4 shrink-0 ${currentStatus === "rejected" ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-200" : "text-muted-foreground"}`}
        >
          <XCircle className="h-4 w-4 shrink-0" />
          Rejected ({counts.rejected})
        </Button>
      </div>

      {/* Passes List */}
      <div className="space-y-4">
        {passes.length > 0 ? (
          passes.map((pass, index) => (
            <PassCard
              key={pass.id}
              pass={pass}
              isAdmin={isAdmin}
              index={index}
              onEdit={(pass) => {
                if (isAdmin) {
                  setEditingPass(pass);
                } else {
                  setStudentEditingPass(pass);
                  setDialogOpen(true);
                }
              }}
              onView={setViewingPass}
              onDelete={handleDeletePass}
            />
          ))
        ) : (
          <Card className="card-shadow">
            <CardContent className="py-12 text-center">
              <Ticket className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-lg font-medium text-muted-foreground">
                No passes found
              </p>
              {!isAdmin && (
                <Button onClick={() => setDialogOpen(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Request your first pass
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* New Pass Request Dialog */}
      {profile?.id && (
        <PassRequestDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setStudentEditingPass(null);
          }}
          profileId={profile.id}
          onSuccess={fetchPasses}
          editingPass={studentEditingPass}
        />
      )}

      {/* Admin Review Dialog */}
      {profile?.id && (
        <AdminReviewDialog
          pass={editingPass}
          onClose={() => setEditingPass(null)}
          adminProfileId={profile.id}
          onSuccess={fetchPasses}
          onDelete={handleDeletePass}
        />
      )}

      {/* View Approved Pass Dialog */}
      <ViewPassDialog
        pass={viewingPass}
        onClose={() => setViewingPass(null)}
        fallbackName={profile?.full_name}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pass Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this pass request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
