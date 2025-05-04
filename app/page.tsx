import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import OrderProcessor from "@/components/order-processor"

export default function Home() {
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold">Sistema de Automação de Pedidos</h1>
        <p className="text-muted-foreground">Processe pedidos do WhatsApp com facilidade</p>
      </header>

      <Tabs defaultValue="processar" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="processar">Processar Pedido</TabsTrigger>
        </TabsList>
        <TabsContent value="processar" className="mt-6">
          <OrderProcessor />
        </TabsContent>
      </Tabs>
    </div>
  )
}
