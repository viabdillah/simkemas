import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Bindings, Variables } from './types';

// Import Route Files
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import customerRoutes from './routes/customers';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import packagingRoutes from './routes/packagings';
import transactionRoutes from './routes/transactions';
import designRoutes from './routes/designs';
import productionRoutes from './routes/production';
import inventoryRoutes from './routes/inventory';
import materialRoutes from './routes/materials';
import pickupRoutes from './routes/pickup';

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// Global Middleware
app.use('/*', cors());

// Routing Modular
app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/customers', customerRoutes);
app.route('/api/products', productRoutes);
app.route('/api/orders', orderRoutes);
app.route('/api/packagings', packagingRoutes);
app.route('/api/finance', transactionRoutes);
app.route('/api/designs', designRoutes);
app.route('/api/production', productionRoutes);
app.route('/api/inventory', inventoryRoutes);
app.route('/api/materials', materialRoutes);
app.route('/api/pickup', pickupRoutes);

// Root check
app.get('/', (c) => c.text('SIMKEMAS Server is Running'));

export default app;