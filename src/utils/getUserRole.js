export function getUserRole() {
  return localStorage.getItem("user_role") || "call_center"; // default role
}
