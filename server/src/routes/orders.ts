import { Hono } from 'hono';
import { OrderController } from '../controllers/orderController';
import { verifyAuth } from '../middlewares/auth';

const orders = new Hono();
orders.use('/*', verifyAuth);

orders.get('/', OrderController.getAll);       // List Riwayat
orders.get('/:id', OrderController.getOne);    // Detail & Invoice
orders.post('/', OrderController.create);      // Buat Pesanan

export default orders;