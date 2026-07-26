import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  // we are not using any env variables so this is fine
  // this is because the react-draggable library uses process.env...
  // Albeit questionable, will need to raise an issue with the maintainers
  // For reference: https://github.com/react-grid-layout/react-draggable/issues/806
  return {
    envDir: false,
    define: {
      "process.env.DRAGGABLE_DEBUG": JSON.stringify(
        process.env.DRAGGABLE_DEBUG ?? false,
      ),
    },
    plugins: [tailwindcss(), reactRouter()],
    resolve: {
      tsconfigPaths: true,
    },
  };
});
