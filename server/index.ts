import { createApp } from './http/createApp';
import { MultiplayerService } from './multiplayer/service';

const port = Number(process.env.PORT ?? 8787);
const server = createApp(new MultiplayerService());

server.listen(port, () => {
  console.log(`Multiplayer API listening on http://127.0.0.1:${port}`);
});
