import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Money, Product } from '../../types'

export interface CartLine {
  product: Product
  quantity: number
}

export interface CartContextValue {
  lines: CartLine[]
  count: number
  subtotal: Money | null
  add: (product: Product, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  remove: (productId: string) => void
  clear: () => void
}

const EMPTY: CartContextValue = {
  lines: [],
  count: 0,
  subtotal: null,
  add: () => {},
  setQuantity: () => {},
  remove: () => {},
  clear: () => {},
}

const CartContext = createContext<CartContextValue>(EMPTY)

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])

  const add = useCallback((product: Product, quantity = 1) => {
    setLines((current) => {
      const existing = current.find((line) => line.product.id === product.id)
      const maxUsable = Math.max(1, product.stock.quantity)
      if (existing) {
        return current.map((line) =>
          line.product.id === product.id
            ? { ...line, quantity: Math.min(maxUsable, line.quantity + quantity) }
            : line,
        )
      }
      return [...current, { product, quantity: Math.min(maxUsable, quantity) }]
    })
  }, [])

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((current) => {
      const line = current.find((item) => item.product.id === productId)
      if (!line) return current
      if (quantity <= 0) return current.filter((item) => item.product.id !== productId)
      const maxUsable = Math.max(1, line.product.stock.quantity)
      return current.map((item) =>
        item.product.id === productId ? { ...item, quantity: Math.min(maxUsable, quantity) } : item,
      )
    })
  }, [])

  const remove = useCallback((productId: string) => {
    setLines((current) => current.filter((line) => line.product.id !== productId))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, line) => sum + line.quantity, 0)
    const subtotal: Money | null =
      lines.length === 0
        ? null
        : {
            amount: lines.reduce((sum, line) => sum + line.product.price.amount * line.quantity, 0),
            currency: lines[0].product.price.currency,
          }
    return { lines, count, subtotal, add, setQuantity, remove, clear }
  }, [lines, add, setQuantity, remove, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  return useContext(CartContext)
}