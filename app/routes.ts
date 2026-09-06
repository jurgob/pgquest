import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("lesson-1", "routes/lesson-1.tsx"),
  route("lesson-2", "routes/example-2.tsx"),
] satisfies RouteConfig;
