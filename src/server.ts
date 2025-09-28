import app from './app';
import { config } from './config/config';

const port = Number.isFinite(config.app.port) ? config.app.port : 3000;

app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on ${port}`);
});
