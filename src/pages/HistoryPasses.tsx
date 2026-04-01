import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, ArrowLeft, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PassCard } from "@/components/passes/PassCard";
import { ViewPassDialog } from "@/components/passes/ViewPassDialog";
import { Pass } from "@/types/pass";

export default function HistoryPasses() {
    const navigate = useNavigate();
    const { isAdmin, profile } = useAuth();
    const [passes, setPasses] = useState<Pass[]>([]);
    const [viewingPass, setViewingPass] = useState<Pass | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchPasses();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchPasses();

        const channel = supabase
            .channel("passes-history-realtime")
            .on("postgres_changes", { event: "*", schema: "public", table: "passes" }, () => {
                fetchPasses();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [profile?.id, isAdmin]);

    const fetchPasses = async () => {
        let query = supabase
            .from("passes")
            .select(`
        *,
        profiles!passes_student_id_fkey(full_name, room_number, hostel_name, jntu_number, branch, year)
      `)
            .in("status", ["approved", "rejected"])
            .order("created_at", { ascending: false });

        if (!isAdmin && profile?.id) {
            query = query.eq("student_id", profile.id);
        }

        const { data } = await query;
        if (data) {
            setPasses(data as Pass[]);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/passes")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold">Approved Passes</h1>
                </div>
                <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
                    <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                </Button>
            </div>

            {/* History List */}
            <div className="space-y-4">
                {passes.length > 0 ? (
                    passes.map((pass) => (
                        <PassCard
                            key={pass.id}
                            pass={pass}
                            isAdmin={isAdmin}
                            onView={setViewingPass}
                        />
                    ))
                ) : (
                    <Card className="card-shadow">
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <Ticket className="mx-auto h-12 w-12 opacity-20" />
                            <p className="mt-2 text-lg font-medium">No history found</p>
                            <p className="text-sm">Processed passes will appear here.</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* View Pass Dialog */}
            <ViewPassDialog
                pass={viewingPass}
                onClose={() => setViewingPass(null)}
                fallbackName={profile?.full_name}
            />
        </div>
    );
}
