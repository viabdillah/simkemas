import { Hono } from 'hono';
import { MaterialController } from '../controllers/materialController';
import { verifyAuth } from '../middlewares/auth';

const materials = new Hono();
materials.use('/*', verifyAuth);

materials.get('/', MaterialController.getAll);
materials.post('/', MaterialController.createMaterial);
materials.put('/:id', MaterialController.updateMaterial); // Baru
materials.delete('/:id', MaterialController.deleteMaterial);

materials.post('/items', MaterialController.createItem);
materials.put('/items/:id', MaterialController.updateItem); // Baru
materials.delete('/items/:id', MaterialController.deleteItem);

export default materials;