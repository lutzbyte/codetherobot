import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <EmptyState
      title="Page not found"
      hint="This page does not exist. Head back and keep coding."
      action={<Button onClick={() => navigate("/")}>Go home</Button>}
    />
  );
}