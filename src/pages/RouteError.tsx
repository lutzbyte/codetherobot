import { useRouteError } from "react-router-dom";
import { ErrorScreen } from "@/components/ErrorScreen";

export function RouteError() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : "Unexpected error";
  return <ErrorScreen message={message} />;
}