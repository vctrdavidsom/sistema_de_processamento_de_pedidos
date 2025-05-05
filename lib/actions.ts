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
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
            Analise a seguinte mensagem de WhatsApp que contém um pedido e extraia as seguintes informações:
            1. Nome do cliente (se não fornecido, use "Cliente Desconhecido").
            2. Itens pedidos (nome, quantidade, unidade de medida, como "Kg", "peça", "unidade", "grama", etc.).
            3. Endereço de entrega (se fornecido, caso contrário, use "null").
            4. Observações adicionais (se houver, caso contrário, use "null").

            Responda APENAS em formato JSON com a seguinte estrutura:
            {
              "customerName": "Nome do cliente",
              "items": [
                { "name": "Nome do item", "quantity": 2, "medida": "Kg" }
              ],
              "address": "Endereço completo ou null se não fornecido",
              "notes": "Observações adicionais ou null se não houver"
            }

            Certifique-se de que o JSON seja válido e não contenha erros de sintaxe.
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

    // Log para depuração
    console.log("Resposta da API:", extractionResult)

    let extractedData
    try {
      extractedData = JSON.parse(extractionResult)
    } catch (error) {
      console.error("Erro ao fazer o parse da resposta da IA:", extractionResult)
      throw new Error("A resposta da IA não está no formato esperado. Verifique o prompt ou a mensagem enviada.")
    }

    // Valida os campos address e notes
    const address = extractedData.address || null
    const notes = extractedData.notes || null

    // Cria o pedido processado
    const processedOrder: ProcessedOrder = {
      id: uuidv4(),
      customerName: extractedData.customerName || "Cliente Desconhecido",
      items: extractedData.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        medida: item.medida || "unidade", // Certifique-se de que a medida está sendo usada
        price: 0,
      })),
      address,
      notes,
      total: 0,
      timestamp: Date.now(),
      originalMessage: message,
      status: "pending",
    }

    // Adiciona o pedido à lista de pedidos
    orders.push(processedOrder)

    return processedOrder
  } catch (error) {
    console.error("Erro ao processar o pedido:", error)
    throw new Error("Não foi possível processar o pedido. Verifique a mensagem enviada ou tente novamente.")
  }
}



