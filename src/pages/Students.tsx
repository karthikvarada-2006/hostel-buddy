import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const BRANCH_OPTIONS = [
  "CSE", "ECE", "EEE", "MECH", "CIVIL", "IT",
  "AIDS", "AIML", "CSM", "CSD", "Other",
];

const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

interface Student {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  jntu_number: string | null;
  branch: string | null;
  year: string | null;
  room_number: string | null;
  hostel_name: string | null;
  created_at: string;
}

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function Students() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    jntu_number: "",
    branch: "",
    year: "",
    room_number: "",
    hostel_name: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStudents();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchStudents();

    // Voice task listener for Students (handles create/edit — delete is done directly by VoiceNavigation)
    const handleVoiceTask = async (e: any) => {
      const { action, target, index, name } = e.detail;
      if (target !== "student") return;

      // Clear the pending task since we're handling it
      if ((window as any).__pendingVoiceTask?.target === "student") {
        (window as any).__pendingVoiceTask = null;
      }

      if (action === "create") {
        openAddDialog(name);
        return;
      }

      const items = filteredStudents;
      if (items.length === 0) return;

      // Find the target student: by name first, then by index
      let targetItem: Student | undefined;
      if (name) {
        targetItem = items.find((s) =>
          s.full_name.toLowerCase().includes(name.toLowerCase())
        );
        if (!targetItem) {
          toast({ title: "Not Found", description: `No student matching "${name}" was found.`, variant: "destructive" });
          return;
        }
      } else {
        targetItem = items[0];
        if (index === -1) targetItem = items[items.length - 1];
        else if (index > 0 && index < items.length) targetItem = items[index];
      }

      if (!targetItem) return;

      if (action === "edit") {
        openEditDialog(targetItem);
      }
    };

    window.addEventListener("voicetask", handleVoiceTask);

    // Realtime subscription — auto-refresh on any DB change
    const channel = supabase
      .channel("students-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchStudents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("voicetask", handleVoiceTask);
    };
  }, [students, searchQuery]);

  // Check for pending voice tasks when students data loads
  useEffect(() => {
    if (students.length === 0) return;
    const pending = (window as any).__pendingVoiceTask;
    if (pending && pending.target === "student") {
      (window as any).__pendingVoiceTask = null;
      window.dispatchEvent(new CustomEvent("voicetask", { detail: pending }));
    }
  }, [students]);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "student")
      .order("full_name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch students.",
        variant: "destructive",
      });
    } else if (data) {
      setStudents(data as Student[]);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }

    if (!editingStudent) {
      try {
        emailSchema.parse(formData.email);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.email = e.errors[0]?.message || "Invalid email";
        }
      }

      try {
        passwordSchema.parse(formData.password);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.password = e.errors[0]?.message || "Invalid password";
        }
      }
    }

    if (!formData.jntu_number.trim()) {
      newErrors.jntu_number = "JNTU Number is required";
    }

    if (!formData.branch) {
      newErrors.branch = "Branch is required";
    }

    if (!formData.year) {
      newErrors.year = "Year is required";
    }

    if (!formData.room_number.trim()) {
      newErrors.room_number = "Room number is required";
    }

    if (!formData.hostel_name.trim()) {
      newErrors.hostel_name = "Hostel / Block is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitStudent = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (editingStudent) {
        // Update existing student
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: formData.full_name,
            jntu_number: formData.jntu_number || null,
            branch: formData.branch || null,
            year: formData.year || null,
            room_number: formData.room_number || null,
            hostel_name: formData.hostel_name || null,
          })
          .eq("id", editingStudent.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Student updated successfully.",
          variant: "success",
        });
      } else {
        // Create new student using a separate Supabase client to avoid
        // logging out the admin. This client is used only for signUp.
        const { createClient } = await import("@supabase/supabase-js");
        const signUpClient = createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          { auth: { persistSession: false, autoRefreshToken: false } }
        );

        let userId: string;

        const { data: signUpData, error: signUpError } =
          await signUpClient.auth.signUp({
            email: formData.email,
            password: formData.password,
          });

        if (signUpError) {
          // If user already exists in auth (e.g. profile was deleted but auth user remained),
          // try signing in to recover their user ID and re-create the profile.
          const alreadyExists =
            signUpError.message.toLowerCase().includes("already") ||
            signUpError.message.toLowerCase().includes("registered");

          if (alreadyExists) {
            const { data: signInData, error: signInError } =
              await signUpClient.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
              });

            if (signInError) {
              throw new Error(
                "This email already has an auth account with a different password. " +
                "Please use the same password that was originally set for this student, " +
                "or delete the user from the Supabase Dashboard → Authentication → Users."
              );
            }

            userId = signInData.user.id;
            // Sign out from the temporary client
            await signUpClient.auth.signOut();
          } else {
            throw new Error(signUpError.message);
          }
        } else {
          if (!signUpData.user) {
            throw new Error("Failed to create user account");
          }
          userId = signUpData.user.id;
        }

        // Check if profile already exists for this auth user
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingProfile) {
          throw new Error("A student profile already exists for this email.");
        }

        // Insert profile using the main admin client
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: userId,
          email: formData.email,
          full_name: formData.full_name,
          role: "student",
          jntu_number: formData.jntu_number || null,
          branch: formData.branch || null,
          year: formData.year || null,
          room_number: formData.room_number || null,
          hostel_name: formData.hostel_name || null,
        });

        if (profileError) {
          throw new Error(profileError.message);
        }

        toast({
          title: "Success",
          description: "Student added successfully.",
          variant: "success",
        });
      }

      setDialogOpen(false);
      setEditingStudent(null);
      setFormData({
        email: "",
        password: "",
        full_name: "",
        jntu_number: "",
        branch: "",
        year: "",
        room_number: "",
        hostel_name: "",
      });
      fetchStudents();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save student.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudent) return;

    console.log("Attempting to delete student:", deleteStudent.id, "auth user:", deleteStudent.user_id);
    setLoading(true);

    try {
      // First delete the profile
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", deleteStudent.id);

      if (error) {
        console.error("Delete error:", error);
        toast({
          title: "Deletion Failed",
          description: `Error: ${error.message}. Ensure you have admin permissions and all dependencies are handled.`,
          variant: "destructive",
        });
        return;
      }

      // Also delete the auth user via database function so the email can be reused.
      // This requires the delete_auth_user function to exist in the database.
      const { error: rpcError } = await supabase.rpc("delete_auth_user", {
        target_user_id: deleteStudent.user_id,
      });

      if (rpcError) {
        console.warn(
          "Could not delete auth user (the database function may not exist yet):",
          rpcError.message
        );
        // Profile is already deleted, so show partial success
      }

      toast({
        title: "Success",
        description: "Student and all associated records deleted successfully.",
        variant: "success",
      });
      setDeleteStudent(null);
      fetchStudents();
    } catch (err: unknown) {
      console.error("Critical error during delete:", err);
      toast({
        title: "Critical Error",
        description: err instanceof Error ? err.message : "An unexpected error occurred during deletion.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      email: student.email,
      password: "",
      full_name: student.full_name,
      jntu_number: student.jntu_number || "",
      branch: student.branch || "",
      year: student.year || "",
      room_number: student.room_number || "",
      hostel_name: student.hostel_name || "",
    });
    setErrors({});
    setDialogOpen(true);
  };

  const openAddDialog = (name?: string) => {
    setEditingStudent(null);
    setFormData({
      email: "",
      password: "",
      full_name: name || "",
      jntu_number: "",
      branch: "",
      year: "",
      room_number: "",
      hostel_name: "",
    });
    setErrors({});
    setDialogOpen(true);
  };

  const filteredStudents = students.filter(
    (student) =>
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.jntu_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.room_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Manage Students</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => openAddDialog()}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Students Table */}
      <Card className="card-shadow overflow-hidden">
        <CardContent className="p-0">
          {filteredStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Name</TableHead>
                    <TableHead className="min-w-[180px]">Email</TableHead>
                    <TableHead className="min-w-[120px]">JNTU No.</TableHead>
                    <TableHead className="min-w-[100px]">Room</TableHead>
                    <TableHead className="min-w-[120px]">Hostel</TableHead>
                    <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.full_name}
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.jntu_number || "-"}</TableCell>
                      <TableCell>{student.room_number || "-"}</TableCell>
                      <TableCell>{student.hostel_name || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(student)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteStudent(student)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center px-4">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-lg font-medium text-muted-foreground">
                {searchQuery ? "No students found" : "No students added yet"}
              </p>
              {!searchQuery && (
                <Button onClick={() => openAddDialog()} className="mt-4">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add your first student
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Total Students: {students.length}
      </p>

      {/* Add/Edit Student Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? "Edit Student" : "Add New Student"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                placeholder="Enter student's full name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name}</p>
              )}
            </div>

            {!editingStudent && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="jntu_number">JNTU Number *</Label>
              <Input
                id="jntu_number"
                placeholder="e.g., 21B01A0501"
                value={formData.jntu_number}
                onChange={(e) =>
                  setFormData({ ...formData, jntu_number: e.target.value })
                }
              />
              {errors.jntu_number && (
                <p className="text-sm text-destructive">{errors.jntu_number}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Branch *</Label>
                <Select
                  value={formData.branch}
                  onValueChange={(value) =>
                    setFormData({ ...formData, branch: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCH_OPTIONS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.branch && (
                  <p className="text-sm text-destructive">{errors.branch}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Year *</Label>
                <Select
                  value={formData.year}
                  onValueChange={(value) =>
                    setFormData({ ...formData, year: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEAR_OPTIONS.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.year && (
                  <p className="text-sm text-destructive">{errors.year}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="room_number">Room Number *</Label>
                <Input
                  id="room_number"
                  placeholder="e.g., A-101"
                  value={formData.room_number}
                  onChange={(e) =>
                    setFormData({ ...formData, room_number: e.target.value })
                  }
                />
                {errors.room_number && (
                  <p className="text-sm text-destructive">{errors.room_number}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="hostel_name">Hostel / Block *</Label>
                <Input
                  id="hostel_name"
                  placeholder="e.g., Block A"
                  value={formData.hostel_name}
                  onChange={(e) =>
                    setFormData({ ...formData, hostel_name: e.target.value })
                  }
                />
                {errors.hostel_name && (
                  <p className="text-sm text-destructive">{errors.hostel_name}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitStudent} disabled={loading}>
                {loading ? "Saving..." : editingStudent ? "Update" : "Add"} Student
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteStudent}
        onOpenChange={() => setDeleteStudent(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteStudent?.full_name}"? This
              will remove all their data including attendance, complaints, and
              passes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStudent}
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
