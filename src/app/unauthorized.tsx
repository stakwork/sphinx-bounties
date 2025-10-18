import { redirect } from "next/navigation";

export default function Unauthorized() {
  redirect("/login");
}
