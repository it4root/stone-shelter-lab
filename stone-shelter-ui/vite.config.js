import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const proxy = mode !== 'mock' && env.API_PROXY_TARGET
    ? Object.fromEntries(['/api', '/images'].map(path => [path, { target: env.API_PROXY_TARGET, changeOrigin: true }]))
    : undefined;
  return { server: { proxy }, preview: { proxy } };
});
