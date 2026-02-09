import { Hono } from 'hono';
import { CustomerController } from '../controllers/customerController';
import { verifyAuth } from '../middlewares/auth'; // Semua role (termasuk kasir) boleh akses
import { Bindings, Variables } from '../types';

const customers = new Hono<{ Bindings: Bindings, Variables: Variables }>();

customers.use('/*', verifyAuth); // Wajib Login

customers.get('/', CustomerController.getCustomers);
customers.post('/', CustomerController.create);
customers.put('/:id', CustomerController.update);
customers.delete('/:id', CustomerController.delete);
customers.post('/:id/restore', CustomerController.restore);

export default customers;