import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api/api-fetch";

export default async function ProfileRedirect() {
  const res = await apiFetch("/api/auth/session", { credentials: "include" });
  if (!res.ok) {
    redirect("/login");
  }
  const { data } = await res.json();
  if (!data?.pubkey) {
    redirect("/login");
  }
  redirect(`/dashboard/settings/profile?pubkey=${data.pubkey}`);
}
