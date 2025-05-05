import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import type { ProcessedOrder } from "@/lib/types"

interface OrderSummaryProps {
  order: ProcessedOrder
  showStatus?: boolean
}

export function OrderSummary({ order, showStatus = false }: OrderSummaryProps) {
  // Function to get status badge color
  const getStatusBadge = () => {
    switch (order.status) {
      case "completed":
        return <Badge className="bg-green-500">Concluído</Badge>
      case "cancelled":
        return <Badge className="bg-red-500">Cancelado</Badge>
      case "pending":
      default:
        return <Badge className="bg-yellow-500">Pendente</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">Cliente</h3>
          <p>{order.customerName}</p>
        </div>
        {showStatus && order.status && <div>{getStatusBadge()}</div>}
      </div>

      <Separator />

      <div>
        <h3 className="font-medium mb-2">Itens do Pedido</h3>
        <ul className="space-y-2">
          {order.items.map((item, index) => (
            <li key={index} className="flex justify-between">
              <span>
                {item.quantity} {item.medida} {item.name}
              </span>
              <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>

      <Separator />

      <div className="flex justify-between font-bold">
        <span>Total</span>
        <span>R$ {order.total.toFixed(2)}</span>
      </div>

      {order.address && (
        <>
          <Separator />
          <div>
            <h3 className="font-medium">Endereço de Entrega</h3>
            <p className="whitespace-pre-line">{order.address}</p>
          </div>
        </>
      )}

      {order.notes && (
        <>
          <Separator />
          <div>
            <h3 className="font-medium">Observações</h3>
            <p className="whitespace-pre-line">{order.notes}</p>
          </div>
        </>
      )}

      {order.timestamp && (
        <div className="text-xs text-muted-foreground mt-4">
          Data/Hora: {new Date(order.timestamp).toLocaleString("pt-BR")}
        </div>
      )}
    </div>
  )
}
