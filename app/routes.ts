import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),
	route("day3", "routes/day3.tsx"),
] satisfies RouteConfig;
