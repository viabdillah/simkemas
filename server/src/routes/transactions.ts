import { Hono } from 'hono';
import { TransactionController } from '../controllers/transactionController';
import { verifyAuth } from '../middlewares/auth';

const transactions = new Hono();
transactions.use('/*', verifyAuth);

transactions.get('/', TransactionController.getAll);
transactions.post('/manual', TransactionController.createManual); // Ganti endpoint jadi /manual

export default transactions;