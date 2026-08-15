import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/day/1", "routes/day1.tsx"),
  // route("/day/2", "routes/day2.tsx"),
  // route("/day/3", "routes/day3.tsx"),
  route("/levels", "routes/levels.tsx"),
  route("/credits", "routes/credits.tsx"),
] satisfies RouteConfig;
