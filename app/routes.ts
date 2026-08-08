import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/day/1", "routes/day1.tsx"),
  route("/levels", "routes/levels.tsx"),
  route("/credits", "routes/credits.tsx"),
  route("/day/3", "routes/day3.tsx"),
] satisfies RouteConfig;
