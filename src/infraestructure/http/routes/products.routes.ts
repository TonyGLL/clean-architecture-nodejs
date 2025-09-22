import { Router } from 'express';
import { ProductsController } from '../controllers/products.ctrl';
import { container } from '../../ioc/config';
import { expressValidatorErrors } from '../middlewares/validator.middleware';
import { GetProductDetailsValidator, GetProductsByCategoryValidator, SearchProductsValidator } from '../validators/products.validator';

const router = Router();
const controller = container.get<ProductsController>(ProductsController);

router
    .get('/search', SearchProductsValidator, expressValidatorErrors, controller.searchProducts)
    .get('/:productId', GetProductDetailsValidator, expressValidatorErrors, controller.getProductDetails)
    .get('/categories/:categoryId', GetProductsByCategoryValidator, expressValidatorErrors, controller.getProductsByCategory);

export default router;