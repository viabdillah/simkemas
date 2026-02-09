import { Hono } from 'hono';
import { PickupController } from '../controllers/pickupController';
import { verifyAuth } from '../middlewares/auth';

const pickup = new Hono();
pickup.use('/*', verifyAuth);

pickup.get('/', PickupController.getReadyOrders);
pickup.post('/:id/complete', PickupController.processPickup);

export default pickup;