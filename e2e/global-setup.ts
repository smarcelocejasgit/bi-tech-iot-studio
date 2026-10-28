import { createServer } from 'vite';

export default async function startViteForE2E() {
  process.env.VITE_CAMERA_GATEWAY_URL = 'http://camera.test';

  const server = await createServer({
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
    },
  });

  await server.listen();

  return async () => {
    await server.close();
  };
}
