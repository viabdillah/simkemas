import { Hono } from 'hono';
import { InventoryController } from '../controllers/inventoryController';
import { verifyAuth } from '../middlewares/auth';

const inventory = new Hono();
inventory.use('/*', verifyAuth);

inventory.get('/stocks', InventoryController.getStocks);
inventory.post('/update', InventoryController.updateStock);
inventory.get('/logs', InventoryController.getLogs);
inventory.post('/opname/batch', InventoryController.batchOpname);
inventory.delete('/opname/undo/:id', InventoryController.undoOpname);

export default inventory;