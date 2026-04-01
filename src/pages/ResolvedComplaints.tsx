import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, MessageSquare, ArrowLeft, ImageIcon, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

export default function ResolvedComplaints() {
    const { isAdmin, profile } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchComplaints = async () => {
        let query = supabase
            .from("complaints")
            .select(`
        *,
        profiles!complaints_student_id_fkey(full_name, room_number)
      `)
            .eq("status", "resolved")
            .order("updated_at", { ascending: false });

        if (!isAdmin && profile?.id) {
            query = query.eq("student_id", profile.id);
        }

        const { data, error } = await query;
        if (error) {
            toast({ title: "Error", description: "Failed to fetch resolved complaints.", variant: "destructive" });
        } else {
            setComplaints(data as Complaint[]);
        }
    };

    useEffect(() => {
        fetchComplaints();

        // Realtime subscription — auto-refresh on any DB change
        const channel = supabase
            .channel("resolved-complaints-realtime")
            .on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, () => {
                fetchComplaints();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [profile?.id, isAdmin]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchComplaints();
        setRefreshing(false);
    };

    const getSignedUrl = async (path: string): Promise<string | null> => {
        const { data } = await supabase.storage
            .from("complaint-images")
            .createSignedUrl(path, 3600);
        return data?.signedUrl ?? null;
    };

    const handleViewImage = async (imageUrl: string) => {
        const signed = await getSignedUrl(imageUrl);
        if (signed) setViewingImage(signed);
        else toast({ title: "Error", description: "Could not load image.", variant: "destructive" });
    };

    const handleDeleteComplaint = async (id: string) => {
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
            fetchComplaints();
        } catch {
            toast({ title: "Error", description: "Failed to delete complaint.", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(isAdmin ? "/admin/complaints" : "/complaints")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold">Resolved Complaints</h1>
                </div>
                <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing} title="Refresh">
                    <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                </Button>
            </div>

            <div className="space-y-4">
                {complaints.length > 0 ? (
                    complaints.map((complaint) => (
                        <Card key={complaint.id} className="card-shadow transition-colors hover:border-primary/30">
                            <CardContent className="p-4">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-semibold">
                                                {complaint.title}
                                                {complaint.is_edited && (
                                                    <span className="ml-1 text-xs font-normal text-muted-foreground">(edited)</span>
                                                )}
                                            </h3>
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400">
                                                <CheckCircle className="mr-1 h-3 w-3" />
                                                Resolved
                                            </Badge>
                                            {complaint.priority && (
                                                <Badge variant="outline" className="capitalize">
                                                    {complaint.priority}
                                                </Badge>
                                            )}
                                        </div>
                                        {isAdmin && complaint.profiles && (
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                By: {complaint.profiles.full_name}
                                                {complaint.profiles.room_number && ` • Room ${complaint.profiles.room_number}`}
                                            </p>
                                        )}
                                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                            {complaint.description}
                                        </p>

                                        {complaint.image_url && (
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="mt-1 h-auto p-0 text-xs text-primary"
                                                onClick={() => handleViewImage(complaint.image_url!)}
                                            >
                                                <ExternalLink className="mr-1 h-3 w-3" />
                                                View attached image
                                            </Button>
                                        )}

                                        {complaint.resolution_notes && (
                                            <div className="mt-3 rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                                                <p className="text-sm text-green-700 dark:text-green-300">
                                                    <strong className="font-semibold">Resolution Note:</strong> {complaint.resolution_notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right text-sm text-muted-foreground">
                                        <p className="font-medium">Resolved on</p>
                                        <p>{format(new Date(complaint.updated_at), "MMM d, yyyy")}</p>
                                        <p>{format(new Date(complaint.updated_at), "h:mm a")}</p>
                                        <div className="mt-2 flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDeleteComplaint(complaint.id)}
                                                title="Delete Complaint"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
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
                                No resolved complaints yet.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

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
                        <AlertDialogTitle>Delete Resolved Complaint</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this resolved complaint? This action cannot be undone.
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
