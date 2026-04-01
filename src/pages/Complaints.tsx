import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { MessageSquare, Plus, Clock, CheckCircle, AlertCircle, ImageIcon, X, ExternalLink, RefreshCw, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Edit2, Trash2 } from "lucide-react";

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "resolved";
  priority: "low" | "medium" | "high" | null;
  resolution_notes: string | null;
  image_url: string | null;
  is_edited?: boolean | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    room_number: string | null;
  };
}

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export default function Complaints() {
  const { isAdmin, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [adminFormData, setAdminFormData] = useState({
    status: "",
    priority: "",
    resolution_notes: "",
  });
  const [counts, setCounts] = useState({ pending: 0, in_progress: 0, resolved: 0 });
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatus = searchParams.get("status") || "pending";

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchComplaints();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchComplaints();

    // Realtime subscription — auto-refresh on any DB change
    const channel = supabase
      .channel("complaints-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, () => {
        fetchComplaints();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, isAdmin, currentStatus]);

  // Auto-open new complaint dialog when navigated with ?new=true (e.g. from voice command)
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

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  // Voice task listener for Complaints
  useEffect(() => {
    const handleVoiceTask = async (e: any) => {
      const { action, target, index, description } = e.detail;
      if (target !== "complaint") return;

      const items = complaints;
      if (items.length === 0) return;

      let targetItem = items[0];
      if (index === -1) targetItem = items[items.length - 1];
      else if (index > 0 && index < items.length) targetItem = items[index];

      if (!targetItem) return;

      if (action === "delete") {
        handleDeleteComplaint(new MouseEvent('click') as any, targetItem.id);
      } else if (action === "resolve" && isAdmin) {
        // Directly resolve the complaint via DB update
        const { error } = await supabase
          .from("complaints")
          .update({
            status: "resolved" as Complaint["status"],
            resolution_notes: description || "Resolved via voice command",
          })
          .eq("id", targetItem.id);
        if (error) {
          toast({ title: "Error", description: "Failed to resolve complaint.", variant: "destructive" });
        } else {
          toast({ title: "Success", description: `Complaint "${targetItem.title}" resolved.`, variant: "success" });
          fetchComplaints();
        }
      } else if (action === "edit") {
        if (isAdmin) {
          setEditingComplaint(targetItem);
          setAdminFormData({
            status: targetItem.status,
            priority: targetItem.priority || "medium",
            resolution_notes: targetItem.resolution_notes || "",
          });
        } else {
          handleOpenEditDialog(new MouseEvent('click') as any, targetItem);
        }
      }
    };

    window.addEventListener("voicetask", handleVoiceTask);
    return () => window.removeEventListener("voicetask", handleVoiceTask);
  }, [complaints, isAdmin]);

  const fetchComplaints = async () => {
    let query = supabase
      .from("complaints")
      .select(`
        *,
        profiles:student_id(full_name, room_number)
      `)
      .order("created_at", { ascending: false });

    if (!isAdmin && profile?.id) {
      query = query.eq("student_id", profile.id);
    }

    const { data, error } = await query;
    if (error) {
      toast({ title: "Error", description: "Failed to fetch complaints.", variant: "destructive" });
    } else if (data) {
      const allComplaints = data as Complaint[];
      setComplaints(allComplaints.filter(c => c.status === currentStatus));
      setCounts({
        pending: allComplaints.filter((c: Complaint) => c.status === "pending").length,
        in_progress: allComplaints.filter((c: Complaint) => c.status === "in_progress").length,
        resolved: allComplaints.filter((c: Complaint) => c.status === "resolved").length,
      });
    }
  };

  const getSignedUrl = async (path: string): Promise<string | null> => {
    const { data } = await supabase.storage
      .from("complaint-images")
      .createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG or PNG image.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be under 5MB.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    setImageRemoved(false);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(URL.createObjectURL(file));
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (isEditing) {
      setImageRemoved(true);
    }
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmitComplaint = async () => {
    if (!profile?.id) return;
    setUploading(true);

    let imagePath: string | null = null;

    try {
      // Upload image first if selected
      if (selectedFile) {
        const ext = selectedFile.name.split(".").pop();
        const fileName = `${profile.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("complaint-images")
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;
        imagePath = fileName;
      }

      if (isEditing && editingComplaint) {
        const updateData: any = {
          title: formData.title,
          description: formData.description,
          is_edited: true,
        };

        if (imagePath) {
          updateData.image_url = imagePath;
        } else if (imageRemoved) {
          updateData.image_url = null;
        }

        const { error } = await supabase
          .from("complaints")
          .update(updateData)
          .eq("id", editingComplaint.id);

        if (error) throw error;
        toast({ title: "Success", description: "Complaint updated successfully.", variant: "success" });
      } else {
        const { error } = await supabase.from("complaints").insert({
          student_id: profile.id,
          title: formData.title,
          description: formData.description,
          image_url: imagePath,
        });

        if (error) throw error;
        toast({ title: "Success", description: "Complaint submitted successfully.", variant: "success" });
      }

      setDialogOpen(false);
      setIsEditing(false);
      setEditingComplaint(null);
      setFormData({ title: "", description: "" });
      setImageRemoved(false);
      clearFile();
      fetchComplaints();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${isEditing ? "update" : "submit"} complaint.`,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteComplaint = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("complaints")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast({ title: "Success", description: "Complaint deleted successfully.", variant: "success" });
      setDeleteId(null);
      setEditingComplaint(null); // Close admin edit dialog if open
      fetchComplaints();
    } catch {
      toast({ title: "Error", description: "Failed to delete complaint.", variant: "destructive" });
    }
  };

  const handleOpenEditDialog = async (e: React.MouseEvent, complaint: Complaint) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditingComplaint(complaint);
    setFormData({ title: complaint.title, description: complaint.description });
    setImageRemoved(false);

    if (complaint.image_url) {
      const signed = await getSignedUrl(complaint.image_url);
      if (signed) setFilePreview(signed);
    }

    setDialogOpen(true);
  };

  const handleUpdateComplaint = async () => {
    if (!editingComplaint) return;

    const { error } = await supabase
      .from("complaints")
      .update({
        status: adminFormData.status as Complaint["status"],
        priority: adminFormData.priority as Complaint["priority"],
        resolution_notes: adminFormData.resolution_notes || null,
      })
      .eq("id", editingComplaint.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update complaint.", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Complaint updated successfully.", variant: "success" });
      setEditingComplaint(null);
      fetchComplaints();
    }
  };

  const handleViewImage = async (imageUrl: string) => {
    const signed = await getSignedUrl(imageUrl);
    if (signed) setViewingImage(signed);
    else toast({ title: "Error", description: "Could not load image.", variant: "destructive" });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "in_progress": return <AlertCircle className="h-4 w-4" />;
      case "resolved": return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "pending": return "status-pending";
      case "in_progress": return "status-in-progress";
      case "resolved": return "status-resolved";
      default: return "";
    }
  };

  const getPriorityClass = (priority: string | null) => {
    switch (priority) {
      case "low": return "priority-low";
      case "medium": return "priority-medium";
      case "high": return "priority-high";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isAdmin ? "Manage Complaints" : "My Complaints"}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          {!isAdmin && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Complaint
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={currentStatus === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setSearchParams({ status: "pending" })}
          className={`gap-2 rounded-full h-8 px-4 ${currentStatus === "pending" ? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200" : "text-muted-foreground"}`}
        >
          <Clock className="h-4 w-4" />
          Pending ({counts.pending})
        </Button>
        <Button
          variant={currentStatus === "in_progress" ? "default" : "outline"}
          size="sm"
          onClick={() => setSearchParams({ status: "in_progress" })}
          className={`gap-2 rounded-full h-8 px-4 ${currentStatus === "in_progress" ? "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200" : "text-muted-foreground"}`}
        >
          <AlertCircle className="h-4 w-4" />
          In Progress ({counts.in_progress})
        </Button>
        <Button
          variant={currentStatus === "resolved" ? "default" : "outline"}
          size="sm"
          onClick={() => setSearchParams({ status: "resolved" })}
          className={`gap-2 rounded-full h-8 px-4 ${currentStatus === "resolved" ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" : "text-muted-foreground"}`}
        >
          <CheckCircle className="h-4 w-4" />
          Resolved ({counts.resolved})
        </Button>
      </div>

      {/* Complaints List */}
      <div className="space-y-4">
        {complaints.length > 0 ? (
          complaints.map((complaint, index) => (
            <Card
              key={complaint.id}
              className="card-shadow cursor-pointer transition-colors hover:border-primary/30"
              onClick={() => {
                if (isAdmin) {
                  setEditingComplaint(complaint);
                  setAdminFormData({
                    status: complaint.status,
                    priority: complaint.priority || "medium",
                    resolution_notes: complaint.resolution_notes || "",
                  });
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">
                        <span className="text-muted-foreground mr-1">{index + 1}</span>
                        {complaint.title}
                        {complaint.is_edited && (
                          <span className="ml-1 text-xs font-normal text-muted-foreground">(edited)</span>
                        )}
                      </h3>
                      <Badge className={getStatusClass(complaint.status)}>
                        {getStatusIcon(complaint.status)}
                        <span className="ml-1 capitalize">
                          {complaint.status.replace("_", " ")}
                        </span>
                      </Badge>
                      {complaint.priority && (
                        <Badge className={getPriorityClass(complaint.priority)}>
                          {complaint.priority}
                        </Badge>
                      )}
                      {complaint.image_url && (
                        <Badge variant="outline" className="gap-1">
                          <ImageIcon className="h-3 w-3" />
                          Photo
                        </Badge>
                      )}
                    </div>
                    {isAdmin && complaint.profiles && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        By: {complaint.profiles.full_name}
                        {complaint.profiles.room_number &&
                          ` • Room ${complaint.profiles.room_number}`}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {complaint.description}
                    </p>
                    {complaint.image_url && (
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-1 h-auto p-0 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewImage(complaint.image_url!);
                        }}
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        View attached image
                      </Button>
                    )}
                    {complaint.resolution_notes && (
                      <div className="mt-2 rounded-lg bg-green-50 p-2 dark:bg-green-900/20">
                        <p className="text-sm text-green-700 dark:text-green-300">
                          <strong>Resolution:</strong> {complaint.resolution_notes}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{format(new Date(complaint.created_at), "MMM d, yyyy")}</p>
                    <p>{format(new Date(complaint.created_at), "h:mm a")}</p>
                    <div className="mt-2 flex justify-end gap-2">
                      {(isAdmin || complaint.status === "pending") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={(e) => {
                            if (isAdmin) {
                              setEditingComplaint(complaint);
                              setAdminFormData({
                                status: complaint.status,
                                priority: complaint.priority || "medium",
                                resolution_notes: complaint.resolution_notes || "",
                              });
                            } else {
                              handleOpenEditDialog(e, complaint);
                            }
                          }}
                          title="Edit Complaint"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {(!isAdmin && complaint.status === "pending" || isAdmin) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDeleteComplaint(e, complaint.id)}
                          title="Delete Complaint"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="card-shadow">
            <CardContent className="py-12 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-lg font-medium text-muted-foreground">
                No complaints found
              </p>
              {!isAdmin && (
                <Button onClick={() => setDialogOpen(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Submit your first complaint
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* New Complaint Dialog (Student) */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { clearFile(); setIsEditing(false); setEditingComplaint(null); setFormData({ title: "", description: "" }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Complaint" : "Submit New Complaint"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Brief title for your complaint"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your complaint in detail..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Photo (optional)</Label>
              {filePreview ? (
                <div className="relative inline-block">
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="h-32 w-32 rounded-lg border object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                    onClick={clearFile}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div
                  className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:border-primary/50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-1 text-sm text-muted-foreground">
                      Click to upload (JPG, PNG, max 5MB)
                    </p>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setDialogOpen(false); clearFile(); }}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitComplaint}
                disabled={!formData.title || !formData.description || uploading}
              >
                {uploading ? (isEditing ? "Updating..." : "Submitting...") : (isEditing ? "Update Complaint" : "Submit Complaint")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Complaint Dialog (Admin) */}
      <Dialog
        open={!!editingComplaint && isAdmin}
        onOpenChange={(open) => !open && setEditingComplaint(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Complaint</DialogTitle>
          </DialogHeader>
          {editingComplaint && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-semibold">{editingComplaint.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  {editingComplaint.description}
                </p>
                {editingComplaint.profiles && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Submitted by: {editingComplaint.profiles.full_name}
                  </p>
                )}
                {editingComplaint.image_url && (
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2 h-auto p-0 text-xs"
                    onClick={() => handleViewImage(editingComplaint.image_url!)}
                  >
                    <ImageIcon className="mr-1 h-3 w-3" />
                    View attached image
                  </Button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={adminFormData.status}
                    onValueChange={(value) => setAdminFormData({ ...adminFormData, status: value })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={adminFormData.priority}
                    onValueChange={(value) => setAdminFormData({ ...adminFormData, priority: value })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resolution">Resolution Notes</Label>
                <Textarea
                  id="resolution"
                  placeholder="Add resolution notes..."
                  rows={3}
                  value={adminFormData.resolution_notes}
                  onChange={(e) => setAdminFormData({ ...adminFormData, resolution_notes: e.target.value })}
                />
              </div>
              <div className="flex justify-between gap-2">
                <Button
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={(e) => handleDeleteComplaint(e, editingComplaint.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditingComplaint(null)}>Cancel</Button>
                  <Button onClick={handleUpdateComplaint}>Update</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog */}
      <Dialog open={!!viewingImage} onOpenChange={(open) => !open && setViewingImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complaint Image</DialogTitle>
          </DialogHeader>
          {viewingImage && (
            <img
              src={viewingImage}
              alt="Complaint attachment"
              className="w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Complaint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this complaint? This action cannot be undone.
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
