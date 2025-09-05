import { CronJob } from 'cron';
import axios from 'axios';
import { IFakeStoreAPIProduct } from '../application/dtos/products.dto';
import { DOMAIN_TYPES } from '../domain/ioc.types';
import { IProductsRepository } from '../domain/repositories/products.repository';
import { container } from '../infraestructure/ioc/config';
import { Product } from '../domain/entities/product';

// Función para sanitizar texto (remover caracteres no ASCII)
const sanitizeText = (text: string): string => {
    if (!text) return '';
    // Remover caracteres de control y no ASCII
    return text.replace(/[^\x20-\x7E]/g, '');
}

export const fetchExternalData = async () => {
    try {
        console.log('Iniciando petición HTTP...');

        // Hacer una única petición GET a un sitio externo
        const { data } = await axios.get<IFakeStoreAPIProduct[]>('https://fakestoreapi.com/products');

        const products: Product[] = data.map((item: IFakeStoreAPIProduct) => (
            {
                id: item.id,
                name: sanitizeText(item.title),
                description: sanitizeText(item.description),
                price: item.price,
                image: sanitizeText(item.image),
                category: sanitizeText(item.category),
                sku: sanitizeText(`${item.id.toString().padStart(6, '0')}`),
                stock: 100,
                quantity: 0,
                reviews: 0,
                rating: 0
            })
        );

        const productsRepository = container.get<IProductsRepository>(DOMAIN_TYPES.IProductsRepository);
        await productsRepository.upsertProductsWithCategories(products);
    } catch (error) {
        console.error('Error en la petición:', error instanceof Error ? error.message : error);
        throw error; // Opcional: relanzar el error si necesitas manejo adicional
    }
}

// Configuración del cron job para ejecutarse cada día a medianoche
export const productsJob = new CronJob(
    '0 0 * * *', // Ejecutar diariamente a medianoche (00:00)
    () => fetchExternalData(),
    null, // onComplete
    false, // No iniciar automáticamente
    'America/Mexico_City' // timeZone
);