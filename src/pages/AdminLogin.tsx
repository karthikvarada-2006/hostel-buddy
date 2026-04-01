import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { motion } from "framer-motion";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function AdminLogin() {
  const { user, profile, isReady, signInWithRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    // Only redirect if already logged in as an admin
    if (isReady && user && profile?.role === "admin") {
      navigate("/admin/dashboard", { replace: true });
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const { error, roleMismatch, actualRole } = await signInWithRole(email, password, "admin");

      if (roleMismatch) {
        // Role doesn't match - block login with clear message
        const roleLabel = actualRole === "student" ? "Student" : actualRole;
        toast({
          title: "Access Denied",
          description: `This account is registered as ${roleLabel}. Please use the ${roleLabel} Login page.`,
          variant: "destructive",
        });
        return;
      }

      if (error) {
        // Handle different error types
        let errorMessage = "An unexpected error occurred. Please try again.";

        if (error.message === "Invalid login credentials") {
          errorMessage = "Invalid credentials. Please check your email and password.";
        } else if (error.message.includes("No account profile found")) {
          errorMessage = "No account found. Please register before logging in.";
        } else {
          errorMessage = error.message;
        }

        toast({
          title: "Login failed",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        // Confirm session exists before navigating
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          toast({
            title: "Welcome back!",
            description: "You have been logged in successfully.",
          });
          navigate("/admin/dashboard", { replace: true });
        }
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="glass-card overflow-hidden">
          <CardHeader className="text-center relative pb-8">
          <Link
            to="/"
            className="absolute left-4 top-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
            <Shield className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Admin Portal</CardTitle>
          <CardDescription>
            Sign in to manage hostel operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an admin account?{" "}
            <Link to="/admin/register" className="text-primary hover:underline">
              Register here
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Are you a student?{" "}
            <Link to="/student/login" className="text-primary hover:underline">
              Student Login
            </Link>
          </p>
        </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
