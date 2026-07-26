import "server-only";
import { redirect } from "next/navigation";
import { getAdminSessionEmail } from "./auth";

export async function requireAdminSession(): Promise<string> {
  const email = await getAdminSessionEmail();
  if (!email) {
    redirect("/admin/login");
  }
  return email;
}
