import * as path from 'path';

const config = {
    base: "/systems/abbrew/",
    publicDir: path.resolve(__dirname, "public"),
    server: {
      port: 30001,
      open: true,
      proxy: {
        "^(?!/systems/abbrew)": "http://localhost:30000/",
        "/socket.io": {
          target: "ws://localhost:30000",
          ws: true,
        },
      },
    },
    resolve: {
      alias: [
        {
          find: "./runtimeConfig",
          replacement: "./runtimeConfig.browser",
        },
      ],
    },
    optimizeDeps: {},
    build: {
      outDir: path.resolve(__dirname, "dist"),
      emptyOutDir: true,
      sourcemap: true,
      brotliSize: true,
      minify: false,
      terserOptions: {
        mangle: false,
        keep_classnames: true,
        keep_fnames: true,
      },
      lib: {
        name: "abbrew",
        entry: path.resolve(__dirname, "module/abbrew.mjs"),
        formats: ["es"],
        fileName: "abbrew",
      },
    },
    plugins: [],
  };
  
  export default config;