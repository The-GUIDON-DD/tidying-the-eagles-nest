import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // we are not using any env variables so this is fine
  // this is because the react-draggable library uses process.env...
  // Albeit questionable, will need to raise an issue with the maintainers
  const env = loadEnv(mode, process.cwd(), "");
  return {
    envDir: false,
    define: {
      "process.env": env,
    },
    plugins: [tailwindcss(), reactRouter()],
    resolve: {
      tsconfigPaths: true,
    },
  };
});
