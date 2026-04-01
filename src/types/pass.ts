export interface PassProfile {
    full_name: string;
    room_number: string | null;
    hostel_name: string | null;
    jntu_number: string | null;
    branch: string | null;
    year: string | null;
}

export interface Pass {
    id: string;
    pass_type: "outing" | "home_vacation";
    reason: string;
    destination: string;
    from_date: string;
    to_date: string;
    status: "pending" | "approved" | "rejected";
    admin_comment: string | null;
    created_at: string;
    profiles?: PassProfile;
}
