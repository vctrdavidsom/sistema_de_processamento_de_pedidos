"use server"

import { OpenAI } from "openai"
import { v4 as uuidv4 } from "uuid"
import { revalidatePath } from "next/cache"
import type { ProcessedOrder, OrderStatus } from "./types"

// Configuração do cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Certifique-se de configurar a variável de ambiente
})

// Armazenamento em memória para fins de demonstração
// Em uma aplicação real, isso seria um banco de dados
const orders: ProcessedOrder[] = []
const savedOrders: ProcessedOrder[] = []

// Funções de processamento de pedidos
export async function getOrders(): Promise<ProcessedOrder[]> {
  // Retorna os pedidos ordenados por timestamp (mais recentes primeiro)
  return [...orders].sort((a, b) => b.timestamp - a.timestamp)
}

export async function getSavedOrders(): Promise<ProcessedOrder[]> {
  // Retorna os pedidos salvos ordenados por timestamp (mais recentes primeiro)
  return [...savedOrders].sort((a, b) => b.timestamp - a.timestamp)
}

export async function processOrder(message: string): Promise<ProcessedOrder> {
  try {
    // Usa a API do OpenAI para extrair informações da mensagem
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Substitua pelo modelo desejado
      messages: [
        {
          role: "system",
          content: `
            Analise a seguinte mensagem de WhatsApp que contém um pedido e extraia as seguintes informações:
            1. Nome do cliente
            2. Itens pedidos (nome, quantidade)
            3. Endereço de entrega (se fornecido)
            4. Observações adicionais (se houver)

            Responda APENAS em formato JSON com a seguinte estrutura:
            {
              "customerName": "Nome do cliente",
              "items": [
                { "name": "Nome do item", "quantity": 2 }
              ],
              "address": "Endereço completo ou null se não fornecido",
              "notes": "Observações adicionais ou null se não houver"
            }
          `,
        },
        {
          role: "user",
          content: `Mensagem: ${message}`,
        },
      ],
      max_tokens: 500,
    })

    const extractionResult = response.choices[0].message?.content || ""

    // Faz o parse da resposta da IA
    const extractedData = JSON.parse(extractionResult)

    // Cria os itens com preço padrão de 0 (para ser editado pelo usuário)
    const processedItems = extractedData.items.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: 0, // Preço padrão, será editado pelo usuário
    }))

    // Cria o pedido processado
    const order: ProcessedOrder = {
      id: uuidv4(),
      customerName: extractedData.customerName,
      items: processedItems,
      total: 0, // Será calculado na interface do usuário
      address: extractedData.address || undefined,
      notes: extractedData.notes || undefined,
      timestamp: Date.now(),
      originalMessage: message,
      status: "pending",
    }

    return order
  } catch (error) {
    console.error("Erro ao processar o pedido:", error)
    throw new Error("Não foi possível processar o pedido. Verifique a mensagem e tente novamente.")
  }
}



