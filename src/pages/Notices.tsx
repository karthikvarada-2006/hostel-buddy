import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Megaphone,
  Plus,
  AlertTriangle,
  Edit2,
  Trash2,
  Archive,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Notice {
  id: string;
  title: string;
  content: string;
  is_important: boolean;
  is_archived: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export default function Notices() {
  const { isAdmin, profile } = useAuth();
  const { toast } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<Notice | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    is_important: false,
  });

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotices();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchNotices();

    // Voice task listener for Notices (handles create/edit — delete/archive done by VoiceNavigation directly)
    const handleVoiceTask = (e: any) => {
      const { action, target, index } = e.detail;
      if (target !== "notice") return;

      // Clear the pending task since we're handling it
      if ((window as any).__pendingVoiceTask?.target === "notice") {
        (window as any).__pendingVoiceTask = null;
      }

      if (action === "create") {
        setEditingNotice(null);
        setFormData({ title: "", content: "", is_important: false });
        setDialogOpen(true);
        return;
      }

      const items = notices.filter(n => !n.is_archived);
      if (items.length === 0) return;

      let targetItem = items[0];
      if (index === -1) targetItem = items[items.length - 1];
      else if (index > 0 && index < items.length) targetItem = items[index];

      if (!targetItem) return;

      if (action === "edit") {
        const targetIdx = (index === undefined || index === null) ? 0 : (index === -1 ? items.length - 1 : index);
        const itemToEdit = items[targetIdx];
        if (itemToEdit) openEditDialog(itemToEdit);
      }
    };

    window.addEventListener("voicetask", handleVoiceTask);

    // Realtime subscription — auto-refresh on any DB change
    const channel = supabase
      .channel("notices-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "notices" }, () => {
        fetchNotices();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("voicetask", handleVoiceTask);
    };
  }, [isAdmin, notices]);

  // Check for pending voice tasks when notices data loads
  useEffect(() => {
    if (notices.length === 0) return;
    const pending = (window as any).__pendingVoiceTask;
    if (pending && pending.target === "notice") {
      (window as any).__pendingVoiceTask = null;
      window.dispatchEvent(new CustomEvent("voicetask", { detail: pending }));
    }
  }, [notices]);

  const fetchNotices = async () => {
    const { data } = await supabase
      .from("notices")
      .select(`
        *,
        profiles:created_by(full_name)
      `)
      .order("created_at", { ascending: false });

    if (data) {
      setNotices(data as Notice[]);
    }
  };

  const handleSubmitNotice = async () => {
    if (!profile?.id) return;

    let error;
    if (editingNotice) {
      const result = await supabase
        .from("notices")
        .update({
          title: formData.title,
          content: formData.content,
          is_important: formData.is_important,
        })
        .eq("id", editingNotice.id);
      error = result.error;
    } else {
      const result = await supabase.from("notices").insert({
        title: formData.title,
        content: formData.content,
        is_important: formData.is_important,
        created_by: profile.id,
      });
      error = result.error;
    }

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save notice.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Notice ${editingNotice ? "updated" : "posted"} successfully.`,
        variant: "success",
      });
      setDialogOpen(false);
      setEditingNotice(null);
      setFormData({ title: "", content: "", is_important: false });
      fetchNotices();
    }
  };

  const handleArchiveNotice = async (notice: Notice) => {
    const { error } = await supabase
      .from("notices")
      .update({ is_archived: !notice.is_archived })
      .eq("id", notice.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update notice.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Notice ${notice.is_archived ? "restored" : "archived"}.`,
      });
      fetchNotices();
    }
  };

  const handleDeleteNotice = async () => {
    if (!deleteNotice) return;

    const { error } = await supabase
      .from("notices")
      .delete()
      .eq("id", deleteNotice.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete notice.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Notice deleted successfully.",
        variant: "success",
      });
      setDeleteNotice(null);
      fetchNotices();
    }
  };

  const openEditDialog = (notice: Notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      is_important: notice.is_important,
    });
    setDialogOpen(true);
  };

  const activeNotices = notices.filter((n) => !n.is_archived);
  const archivedNotices = notices.filter((n) => n.is_archived);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notice Board</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          {isAdmin && (
            <Button
              onClick={() => {
                setEditingNotice(null);
                setFormData({ title: "", content: "", is_important: false });
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Post Notice
            </Button>
          )}
        </div>
      </div>

      {/* Active Notices */}
      <div className="space-y-4">
        {activeNotices.length > 0 ? (
          activeNotices.map((notice, index) => (
            <Card
              key={notice.id}
              className={`card-shadow ${notice.is_important
                ? "border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10"
                : ""
                }`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-muted-foreground mr-1 text-sm">{index + 1}</span>
                      {notice.is_important && (
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      )}
                      <h3 className="text-lg font-semibold">{notice.title}</h3>
                      {notice.is_important && (
                        <Badge className="bg-amber-500 text-white">
                          Important
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                      {notice.content}
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Posted by {notice.profiles?.full_name || "Admin"} •{" "}
                      {format(new Date(notice.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(notice)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleArchiveNotice(notice)}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteNotice(notice)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="card-shadow">
            <CardContent className="py-12 text-center">
              <Megaphone className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-lg font-medium text-muted-foreground">
                No notices posted yet
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Archived Notices (Admin Only) */}
      {isAdmin && archivedNotices.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Archived Notices
          </h2>
          {archivedNotices.map((notice, index) => (
            <Card key={notice.id} className="card-shadow opacity-60">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-muted-foreground text-xs">{index + 1}</span>
                      <h4 className="font-semibold">{notice.title}</h4>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {notice.content}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleArchiveNotice(notice)}
                    >
                      Restore
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteNotice(notice)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Notice Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingNotice ? "Edit Notice" : "Post New Notice"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Notice title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Write your notice here..."
                rows={5}
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <Label htmlFor="important">Mark as Important</Label>
              </div>
              <Switch
                id="important"
                checked={formData.is_important}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_important: checked })
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitNotice}
                disabled={!formData.title || !formData.content}
              >
                {editingNotice ? "Update" : "Post"} Notice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteNotice} onOpenChange={() => setDeleteNotice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteNotice?.title}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNotice}
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
