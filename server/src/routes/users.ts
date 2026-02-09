import { Hono } from 'hono';
import { AuthController } from '../controllers/authController';
import { verifyAuth, requireAdmin } from '../middlewares/auth';
import { Bindings, Variables } from '../types';

const users = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// Protect All Routes
users.use('/*', verifyAuth, requireAdmin);

users.post('/', AuthController.register);      // Create
users.get('/', AuthController.getUsers);       // Read (List)
users.put('/:id', AuthController.updateUser);  // Update (NEW)
users.delete('/:id', AuthController.deleteUser); // Soft Delete
users.post('/:id/restore', AuthController.restoreUser); // Restore (NEW)
users.delete('/:id/permanent', AuthController.permanentDeleteUser); // Hard Delete (NEW)

export default users;