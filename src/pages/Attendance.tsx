import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClipboardCheck, Check, X, CalendarDays, Users, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, isToday, startOfMonth, endOfMonth } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { VoiceTask } from "@/types/voice";


interface AttendanceRecord {
  id: string;
  attendance_date: string;
  is_present: boolean;
}

interface StudentAttendance {
  student_id: string;
  student_name: string;
  is_present: boolean;
}

export default function Attendance() {
  const { isAdmin, profile } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (isAdmin) {
      await fetchStudentsForDate();
    } else {
      await fetchStudentAttendance();
    }
    setRefreshing(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStudentsForDate();
    } else {
      fetchStudentAttendance();
    }

    // Voice task listener for Attendance
    const handleVoiceTask = (e: CustomEvent<VoiceTask>) => {
      const { action, target, name, names, status } = e.detail;
      if (target !== "attendance") return;

      // Clear the pending task since we're handling it
      if ((window as any).__pendingVoiceTask?.target === "attendance") {
        (window as any).__pendingVoiceTask = null;
      }

      if (isAdmin && action === "mark") {
        handleMarkAllPresent();
      } else if (isAdmin && action === "mark_all_absent") {
        setStudents((prev) => prev.map((s) => ({ ...s, is_present: false })));
        toast({ title: "Success", description: "All students marked as absent." });
      } else if (isAdmin && action === "mark_student") {
        // Support both single name and names array
        const nameList: string[] = names || (name ? [name] : []);
        if (nameList.length === 0) return;

        setStudents((prev) => {
          let updated = [...prev];
          const foundNames: string[] = [];
          const notFound: string[] = [];
          const isPresent = status === "present";

          for (const n of nameList) {
            const found = updated.find((s) => s.student_name.toLowerCase().includes(n.toLowerCase()));
            if (found) {
              foundNames.push(found.student_name);
              updated = updated.map((s) =>
                s.student_id === found.student_id ? { ...s, is_present: isPresent } : s
              );
            } else {
              notFound.push(n);
            }
          }

          if (foundNames.length > 0) {
            toast({ title: "Success", description: `${foundNames.join(", ")} marked as ${status}.` });
          }
          if (notFound.length > 0) {
            toast({ title: "Not Found", description: `Could not find: ${notFound.join(", ")}`, variant: "destructive" });
          }
          return updated;
        });
      } else if (isAdmin && action === "resolve") {
        handleSubmitAttendance();
      }
    };

    window.addEventListener("voicetask", handleVoiceTask);

    // Realtime subscription — auto-refresh on any DB change
    const channel = supabase
      .channel("attendance-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, () => {
        if (isAdmin) fetchStudentsForDate();
        else fetchStudentAttendance();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("voicetask", handleVoiceTask);
    };
  }, [isAdmin, profile?.id, selectedDate]);

  // Check for pending voice tasks when students data loads
  useEffect(() => {
    if (students.length === 0) return;
    const pending = (window as any).__pendingVoiceTask;
    if (pending && pending.target === "attendance") {
      (window as any).__pendingVoiceTask = null;
      window.dispatchEvent(new CustomEvent("voicetask", { detail: pending }));
    }
  }, [students]);

  const fetchStudentAttendance = async () => {
    if (!profile?.id) return;

    const startDate = format(startOfMonth(selectedDate), "yyyy-MM-dd");
    const endDate = format(endOfMonth(selectedDate), "yyyy-MM-dd");

    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("student_id", profile.id)
      .gte("attendance_date", startDate)
      .lte("attendance_date", endDate)
      .order("attendance_date", { ascending: false });

    if (data) {
      setAttendanceRecords(data);
    }
  };

  const fetchStudentsForDate = async () => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    // Fetch all students
    const { data: studentsData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "student")
      .order("full_name");

    // Fetch attendance for the selected date
    const { data: attendanceData } = await supabase
      .from("attendance")
      .select("student_id, is_present")
      .eq("attendance_date", dateStr);

    if (studentsData) {
      const attendanceMap = new Map(
        attendanceData?.map((a) => [a.student_id, a.is_present]) || []
      );

      setStudents(
        studentsData.map((s) => ({
          student_id: s.id,
          student_name: s.full_name,
          is_present: attendanceMap.get(s.id) ?? false,
        }))
      );
    }
  };

  const handleMarkAttendance = (studentId: string, isPresent: boolean) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.student_id === studentId ? { ...s, is_present: isPresent } : s
      )
    );
  };

  const handleMarkAllPresent = () => {
    setStudents((prev) =>
      prev.map((s) => ({ ...s, is_present: true }))
    );
    toast({
      title: "Success",
      description: "All students marked as present locally.",
    });
  };

  const handleSubmitAttendance = async () => {
    if (!profile?.id) return;
    setLoading(true);

    const dateStr = format(selectedDate, "yyyy-MM-dd");

    // Prepare batch upsert data
    const upsertData = students.map((s) => ({
      student_id: s.student_id,
      attendance_date: dateStr,
      is_present: s.is_present,
      marked_by: profile.id,
    }));

    const { error } = await supabase
      .from("attendance")
      .upsert(upsertData, {
        onConflict: "student_id,attendance_date"
      });

    setLoading(false);

    if (error) {
      console.error("Attendance submission error:", error);
      toast({
        title: "Error",
        description: "Failed to submit attendance.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Attendance submitted successfully!",
        variant: "success",
      });
    }
  };

  const presentCount = attendanceRecords.filter((a) => a.is_present).length;
  const totalCount = attendanceRecords.length;
  const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  // For calendar highlighting
  const presentDates = attendanceRecords
    .filter((a) => a.is_present)
    .map((a) => new Date(a.attendance_date));
  const absentDates = attendanceRecords
    .filter((a) => !a.is_present)
    .map((a) => new Date(a.attendance_date));

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <Card className="card-shadow">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                Mark Attendance
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing} title="Refresh">
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                </Button>
                <input
                  type="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="rounded-md border bg-background px-3 py-2"
                />
                <Button 
                  onClick={handleMarkAllPresent} 
                  disabled={loading}
                  className="bg-green-600/20 text-green-500 hover:bg-green-600/30 border-green-500/30"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Mark All Present
                </Button>
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleSubmitAttendance}
                  disabled={loading}
                >
                  <Check className="mr-2 h-4 w-4" />
                  {loading ? "Submitting..." : "Submit Attendance"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {students.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.student_id}>
                      <TableCell className="font-medium">
                        {student.student_name}
                      </TableCell>
                      <TableCell className="text-center">
                        {student.is_present ? (
                          <Badge className="status-approved">Present</Badge>
                        ) : (
                          <Badge className="status-rejected">Absent</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "transition-all duration-200",
                              student.is_present 
                                ? "bg-green-600 text-white hover:bg-green-700 border-green-600 shadow-[0_0_15px_rgba(22,163,74,0.4)]" 
                                : "text-muted-foreground hover:text-green-600 hover:bg-green-600/10"
                            )}
                            onClick={() =>
                              handleMarkAttendance(student.student_id, true)
                            }
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "transition-all duration-200",
                              !student.is_present 
                                ? "bg-red-600 text-white hover:bg-red-700 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]" 
                                : "text-muted-foreground hover:text-red-600 hover:bg-red-600/10"
                            )}
                            onClick={() =>
                              handleMarkAttendance(student.student_id, false)
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">
                  No students found. Add students first.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Student View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Attendance</h1>
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing} title="Refresh">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="card-shadow">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
              <Check className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Present</p>
              <p className="text-2xl font-bold">{presentCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <X className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Absent</p>
              <p className="text-2xl font-bold">{totalCount - presentCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Percentage</p>
              <p className="text-2xl font-bold">{percentage}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calendar View */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Attendance Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              onMonthChange={setSelectedDate}
              modifiers={{
                present: presentDates,
                absent: absentDates,
              }}
              modifiersStyles={{
                present: {
                  backgroundColor: "hsl(142 76% 36% / 0.2)",
                  color: "hsl(142 76% 25%)",
                  fontWeight: "bold",
                },
                absent: {
                  backgroundColor: "hsl(0 84% 60% / 0.2)",
                  color: "hsl(0 84% 40%)",
                  fontWeight: "bold",
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Recent History */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceRecords.length > 0 ? (
              <div className="space-y-2">
                {attendanceRecords.slice(0, 10).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${record.is_present
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                          }`}
                      >
                        {record.is_present ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </div>
                      <span className="font-medium">
                        {format(new Date(record.attendance_date), "EEE, MMM d")}
                      </span>
                    </div>
                    <Badge
                      className={
                        record.is_present ? "status-approved" : "status-rejected"
                      }
                    >
                      {record.is_present ? "Present" : "Absent"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">
                  No attendance records found
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
