import express, { Request, Response } from 'express';
import routes from './Routes/routes'; 
const port = 3000;


const app = express();

app.use(express.json());

app.use("/api", routes);

app.get("/", (req, res) => {
  res.send("API");
});

app.listen(port, () => {
  console.log(`Servidor está rodando na porta ${port}`);
});
