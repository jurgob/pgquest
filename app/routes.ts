import { type RouteConfig, index, route } from "@react-router/dev/routes";
import { lessons } from "./sql/lesson-catalog";

export default [
  index("routes/home.tsx"),
  ...lessons.map((lesson) => route(`lessons/${lesson.slug}`, lesson.routeModule)),
  route("playground", "routes/playground.tsx"),
  route("health", "routes/health.tsx"),
  route("ping", "routes/ping.tsx"),
] satisfies RouteConfig;
