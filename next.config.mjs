import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // El build local veía el lockfile de la carpeta padre y compilaba el proyecto equivocado.
  turbopack: { root },
};

export default nextConfig;
