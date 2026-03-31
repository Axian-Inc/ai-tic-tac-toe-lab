import { createApp } from './http/createApp';
import { MultiplayerService } from './multiplayer/service';
import { attachRealtimeServer } from './realtime/attachRealtimeServer';

const port = Number(process.env.PORT ?? 8787);
const service = new MultiplayerService();
const server = createApp(service);

attachRealtimeServer(server, service);

server.listen(port, () => {
  console.log(`Multiplayer API listening on http://127.0.0.1:${port}`);
});
