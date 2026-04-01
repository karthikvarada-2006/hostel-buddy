// Student Profile Page
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  User,
  Mail,
  Building2,
  Hash,
  Calendar,
  GraduationCap,
  BookOpen,
  Award,
} from "lucide-react";
import { format } from "date-fns";

export default function Profile() {
  const { profile } = useAuth();

  const profileFields = [
    {
      icon: User,
      label: "Full Name",
      value: profile?.full_name || "Not provided",
    },
    {
      icon: Mail,
      label: "Email Address",
      value: profile?.email || "Not provided",
    },
    {
      icon: Award,
      label: "JNTU Number",
      value: profile?.jntu_number || "Not provided",
    },
    {
      icon: BookOpen,
      label: "Branch",
      value: profile?.branch || "Not provided",
    },
    {
      icon: GraduationCap,
      label: "Year",
      value: profile?.year || "Not provided",
    },
    {
      icon: Hash,
      label: "Room Number",
      value: profile?.room_number || "Not assigned",
    },
    {
      icon: Building2,
      label: "Hostel / Block",
      value: profile?.hostel_name || "Not assigned",
    },
    {
      icon: Calendar,
      label: "Member Since",
      value: profile?.created_at
        ? format(new Date(profile.created_at), "MMMM d, yyyy")
        : "N/A",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="card-shadow overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary to-primary/80" />
        <CardContent className="relative pb-6">
          <div className="absolute -top-12 left-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-background bg-primary text-3xl font-bold text-primary-foreground">
              {profile?.full_name?.charAt(0)?.toUpperCase() || "S"}
            </div>
          </div>
          <div className="pt-14">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{profile?.full_name}</h1>
              <Badge className="bg-primary/10 text-primary">Student</Badge>
            </div>
            <p className="mt-1 text-muted-foreground">
              {profile?.hostel_name || "Hostel"} • Room {profile?.room_number || "N/A"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Student Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {profileFields.map((field, index) => (
              <div
                key={index}
                className="flex items-start gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <field.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {field.label}
                  </p>
                  <p className="mt-0.5 truncate font-medium">{field.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Admin Note */}
      <Card className="card-shadow border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-4 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">
              Need to update your information?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Please contact your hostel warden or administrator to update your profile details such as room number, hostel assignment, or personal information.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
