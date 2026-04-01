import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Home, Loader2 } from "lucide-react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function Auth() {
  const { user, profile, isReady, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});

  useEffect(() => {
    if (isReady && user && profile) {
      const dashboardPath = profile.role === "admin" ? "/admin/dashboard" : "/dashboard";
      navigate(dashboardPath);
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

    if (!isLogin && !fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Login failed",
            description: error.message === "Invalid login credentials"
              ? "Invalid email or password. Please try again."
              : error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have been logged in successfully.",
          });
        }
      } else {
        const { error } = await signUp(email, password, fullName, "admin");
        if (error) {
          toast({
            title: "Sign up failed",
            description: error.message.includes("already registered")
              ? "This email is already registered. Please log in instead."
              : error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Account created!",
            description: "Your admin account has been created successfully.",
          });
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="glass-card overflow-hidden">
          <CardHeader className="text-center pb-8 border-b border-white/10 mb-6 bg-white/5 relative">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Home className="h-8 w-8" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">Hostel Hub</CardTitle>
            <CardDescription className="text-base font-medium mt-2">
              {isLogin
                ? "Sign in to your account to continue"
                : "Create your admin account to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isLogin ? "login" : "register"}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
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
                  )}

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
                </motion.div>
              </AnimatePresence>

              <Button type="submit" className="w-full premium-btn h-12 text-lg mt-6" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLogin ? "Sign In" : "Create Admin Account"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground font-medium">
                {isLogin ? "Don't have an admin account?" : "Already have an account?"}
              </p>
              <Button
                variant="link"
                className="mt-1 text-primary hover:text-primary/80 font-semibold"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
              >
                {isLogin ? "Create Admin Account" : "Sign In"}
              </Button>
            </div>

            {isLogin && (
              <p className="mt-6 text-center text-xs text-muted-foreground italic">
                Students: Contact your warden to get login credentials
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
