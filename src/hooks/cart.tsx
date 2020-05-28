import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      // await AsyncStorage.removeItem('@GoMarketplace:products');

      const savedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (savedProducts) {
        setProducts([...JSON.parse(savedProducts)]);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const productExists = products.findIndex(item => item.id === id);

      if (productExists >= 0) {
        const incrementProducts = [...products];

        incrementProducts[productExists].quantity += 1;

        setProducts(incrementProducts);
      }
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(item => item.id === id);

      if (productIndex >= 0) {
        if (products[productIndex].quantity === 1) {
          const filtredProducts = products.filter(item => item.id !== id);
          setProducts(filtredProducts);

          await AsyncStorage.setItem(
            '@GoMarketplace:products',
            JSON.stringify(filtredProducts),
          );
        } else {
          const updatedProducts = [...products];
          updatedProducts[productIndex].quantity -= 1;

          setProducts(updatedProducts);

          await AsyncStorage.setItem(
            '@GoMarketplace:products',
            JSON.stringify(updatedProducts),
          );
        }
      }
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(item => item.id === product.id);

      if (productExists) {
        increment(productExists.id);
      } else {
        const newProduct = {
          ...product,
          quantity: 1,
        };

        setProducts(allProducts => [...allProducts, newProduct]);

        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify([...products, newProduct]),
        );
      }
    },
    [increment, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
