import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { createDataStore } from "./data/createStore.js";

const store = await createDataStore();
const app = createApp(store);

app.listen(env.port, () => {
  console.log(
    `Trackly API running on http://localhost:${env.port} (${env.mongoUri ? "MongoDB" : "memory demo"})`,
  );
});
