import express from 'express';
import cors from 'cors';
import { createServer } from 'vite';

const app = express();
app.use(cors());

const viteServer = createServer({
    server: {
        middlewareMode: true,
    },
});

app.use(viteServer.middlewares);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});