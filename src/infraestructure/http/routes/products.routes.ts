import { Router } from 'express';
import { ProductsController } from '../controllers/products.ctrl';
import { container } from '../../ioc/config';

const router = Router();
const controller = container.get<ProductsController>(ProductsController);

router
    .get('/search', controller.searchProducts)
    .get('/:id', controller.getProductDetails)
    .get('/categories/:id', controller.getProductsByCategory);

export default router;