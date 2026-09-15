import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("lessons/lesson-1", "routes/lesson-1.tsx"),
  route("lessons/lesson-2", "routes/lesson-2.tsx"),
  route("lessons/lesson-3", "routes/example-3.tsx"),
  route("lessons/lesson-4", "routes/lesson-3.tsx"),
  route("lessons/lesson-5", "routes/lesson-4.tsx"),
  route("lessons/lesson-6", "routes/lesson-5.tsx"),
  route("lessons/lesson-7", "routes/lesson-6.tsx"),
  route("lessons/lesson-8", "routes/lesson-7.tsx"),
  route("lessons/lesson-9", "routes/lesson-8.tsx"),
  route("lessons/lesson-10", "routes/lesson-9.tsx"),
  route("lessons/lesson-11", "routes/lesson-10.tsx"),
  route("lessons/lesson-12", "routes/lesson-11.tsx"),
  route("lessons/lesson-13", "routes/lesson-12.tsx"),
  route("lessons/lesson-14", "routes/lesson-13.tsx"),
  route("lessons/lesson-15", "routes/lesson-14.tsx"),
  route("lessons/lesson-16", "routes/lesson-15.tsx"),
  route("playground", "routes/playground.tsx"),
] satisfies RouteConfig;
