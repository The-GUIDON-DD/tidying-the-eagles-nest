import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("day2", "routes/day2.tsx"),
] satisfies RouteConfig;
