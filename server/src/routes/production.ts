import { Hono } from 'hono';
import { ProductionController } from '../controllers/productionController';
import { verifyAuth } from '../middlewares/auth';

const production = new Hono();
production.use('/*', verifyAuth);

production.get('/queue', ProductionController.getQueue);
production.put('/:id/status', ProductionController.updateStatus);
production.get('/history', ProductionController.getHistory);

export default production;