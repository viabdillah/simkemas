import { Hono } from 'hono';
import { ProductController } from '../controllers/productController';
import { verifyAuth } from '../middlewares/auth';

const products = new Hono();
products.use('/*', verifyAuth);

// Route agak unik karena butuh customerId
products.get('/customer/:customerId', ProductController.getByCustomer);
products.post('/customer/:customerId', ProductController.create);
products.put('/:id', ProductController.update);
products.delete('/:id', ProductController.delete);
products.post('/:id/restore', ProductController.restore);

export default products;