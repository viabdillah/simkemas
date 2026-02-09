import { Hono } from 'hono';
import { DesignController } from '../controllers/designController';
import { verifyAuth } from '../middlewares/auth';

const designs = new Hono();
designs.use('/*', verifyAuth);

designs.get('/queue', DesignController.getQueue);
designs.put('/:id/status', DesignController.updateStatus);
designs.get('/history', DesignController.getHistory);

export default designs;