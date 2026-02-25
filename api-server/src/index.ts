import { createAppServer } from './server';

const PORT = Number(process.env.PORT || 4000);

const server = createAppServer();
server.listen(PORT, () => {
  console.log(`tic-tac-toe api listening on http://localhost:${PORT}`, Date.now());
});
