import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Loader2, ArrowLeft } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function StudentRegister() {
  const { user, profile, isReady, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [jntuNumber, setJntuNumber] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [hostelName, setHostelName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string; jntuNumber?: string }>({});

  useEffect(() => {
    if (isReady && user && profile) {
      if (profile.role === "student") {
        navigate("/dashboard");
      }
    }
  }, [user, profile, isReady, navigate]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0]?.message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0]?.message;
      }
    }

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!jntuNumber.trim()) {
      newErrors.jntuNumber = "JNTU Number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const { error } = await signUp(email, password, fullName, "student", roomNumber, hostelName, jntuNumber, branch, year);
      if (error) {
        toast({
          title: "Registration failed",
          description: error.message.includes("already registered")
            ? "This email is already registered. Please log in instead."
            : error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account created!",
          description: "Your student account has been created. Please check your email to verify.",
        });
        navigate("/student/login");
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center relative">
          <Link
            to="/"
            className="absolute left-4 top-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <GraduationCap className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Student Registration</CardTitle>
          <CardDescription>
            Create your student account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isSubmitting}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
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
                placeholder="Enter your password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="jntuNumber">JNTU Number *</Label>
              <Input
                id="jntuNumber"
                type="text"
                placeholder="e.g., 20B91A0501"
                value={jntuNumber}
                onChange={(e) => setJntuNumber(e.target.value)}
                disabled={isSubmitting}
              />
              {errors.jntuNumber && (
                <p className="text-sm text-destructive">{errors.jntuNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  type="text"
                  placeholder="e.g., CSE"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="text"
                  placeholder="e.g., 3rd Year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  type="text"
                  placeholder="e.g., A-101"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hostelName">Hostel Name</Label>
                <Input
                  id="hostelName"
                  type="text"
                  placeholder="e.g., Block A"
                  value={hostelName}
                  onChange={(e) => setHostelName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/student/login" className="text-primary hover:underline">
              Sign in here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
