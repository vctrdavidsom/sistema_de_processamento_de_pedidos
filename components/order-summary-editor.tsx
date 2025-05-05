"use client"

import { useState, useEffect } from "react"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Trash2, Plus } from "lucide-react"
import type { ProcessedOrder, OrderItem } from "@/lib/types"

interface OrderSummaryEditorProps {
  order: ProcessedOrder
  onUpdate: (updatedOrder: ProcessedOrder) => void
  readOnly?: boolean
}

export function OrderSummaryEditor({ order, onUpdate, readOnly = false }: OrderSummaryEditorProps) {
  const [items, setItems] = useState<OrderItem[]>(
    order.items.map((item) => ({
      ...item,
      quantity: item.quantity || 1,
      medida: item.medida || "unidade",
    }))
  )
  const [customerName, setCustomerName] = useState(order.customerName)
  const [address, setAddress] = useState(order.address || "")
  const [notes, setNotes] = useState(order.notes || "")

  // Calculate total whenever items change
  useEffect(() => {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    onUpdate({
      ...order,
      customerName,
      items,
      total,
      address: address || undefined,
      notes: notes || undefined,
    })
  }, [items, customerName, address, notes, order, onUpdate])

  const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
    if (readOnly) return

    const newItems = [...items]

    if (field === "price" || field === "quantity") {
      const numValue = typeof value === "string" ? Number.parseFloat(value) : value
      if (!isNaN(numValue) && numValue >= 0) {
        newItems[index][field] = numValue
      }
    } else {
      newItems[index][field] = value as string
    }

    setItems(newItems)
  }

  const handleRemoveItem = (index: number) => {
    if (readOnly) return
    setItems(items.filter((_, i) => i !== index))
  }

  const handleAddItem = () => {
    if (readOnly) return
    setItems([...items, { name: "", quantity: 1, price: 0, medida: "unidade" }])
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Cliente</label>
        <Input
          value={customerName}
          onChange={(e) => !readOnly && setCustomerName(e.target.value)}
          className="mt-1"
          readOnly={readOnly}
        />
      </div>

      <Separator />

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium">Itens do Pedido</label>
          {!readOnly && (
            <Button size="sm" variant="outline" onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar Item
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                className="w-16"
                min="1"
                readOnly={readOnly}
              />
              <Input
                value={item.medida}
                onChange={(e) => handleItemChange(index, "medida", e.target.value)}
                className="w-20"
                placeholder="Unidade"
                readOnly={readOnly}
              />
              <Input
                value={item.name}
                onChange={(e) => handleItemChange(index, "name", e.target.value)}
                className="flex-1"
                placeholder="Nome do item"
                readOnly={readOnly}
              />
              <div className="flex items-center gap-1">
                <span className="text-sm">R$</span>
                <Input
                  type="number"
                  value={item.price}
                  onChange={(e) => handleItemChange(index, "price", e.target.value)}
                  className="w-20"
                  step="0.01"
                  min="0"
                  readOnly={readOnly}
                />
              </div>
              {!readOnly && (
                <Button size="icon" variant="ghost" onClick={() => handleRemoveItem(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          {items.length === 0 && <div className="text-center py-4 text-muted-foreground">Nenhum item adicionado</div>}
        </div>
      </div>

      <Separator />

      <div>
        <label className="text-sm font-medium">Resumo do Pedido</label>
        <ul>
          {items.map((item, index) => (
            <li key={index}>
              {item.quantity} {item.medida} de {item.name}
            </li>
          ))}
        </ul>
      </div>

      <Separator />

      <div className="flex justify-between font-bold">
        <span>Total</span>
        <span>R$ {items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</span>
      </div>

      <Separator />

      <div>
        <label className="text-sm font-medium">Endereço de Entrega</label>
        <Input
          value={address}
          onChange={(e) => !readOnly && setAddress(e.target.value)}
          className="mt-1"
          placeholder="Endereço de entrega (opcional)"
          readOnly={readOnly}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Observações</label>
        <Input
          value={notes}
          onChange={(e) => !readOnly && setNotes(e.target.value)}
          className="mt-1"
          placeholder="Observações adicionais (opcional)"
          readOnly={readOnly}
        />
      </div>
    </div>
  )
}
