import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("lessons/lesson-1", "routes/lesson-1.tsx"),
  route("lessons/lesson-2", "routes/example-2.tsx"),
  route("playground", "routes/playground.tsx"),
] satisfies RouteConfig;
