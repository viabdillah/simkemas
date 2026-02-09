import { Hono } from 'hono';
import { PackagingController } from '../controllers/packagingController';
import { verifyAuth } from '../middlewares/auth';

const packagings = new Hono();
packagings.use('/*', verifyAuth);

// Type Routes
packagings.get('/', PackagingController.getAll);
packagings.post('/types', PackagingController.createType);
packagings.put('/types/:id', PackagingController.updateType); // Baru
packagings.delete('/types/:id', PackagingController.deleteType);

// Size Routes
packagings.post('/sizes', PackagingController.createSize);
packagings.put('/sizes/:id', PackagingController.updateSize); // Baru
packagings.delete('/sizes/:id', PackagingController.deleteSize);

export default packagings;