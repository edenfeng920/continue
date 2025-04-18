import { Chunk, LLMOptions } from "../../index.js";

import OpenAI from "./OpenAI.js";

class Cangjie extends OpenAI {
  static providerName = "cangjie";
  static defaultOptions: Partial<LLMOptions> | undefined = {
    apiBase: "http://10.29.180.154:8100/v1/",
    maxEmbeddingBatchSize: 128,
  };

  async rerank(query: string, chunks: Chunk[]): Promise<number[]> {
    if (!query || chunks.length === 0) {
      return [];
    }
    const url = new URL("rerank", this.apiBase);
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        query,
        documents: chunks.map((chunk) => chunk.content),
        model: this.model ?? "bge-reranker",
      }),
    });

    if (resp.status !== 200) {
      throw new Error(
        `Cangjie Reranker API error ${resp.status}: ${await resp.text()}`,
      );
    }

    const data = (await resp.json()) as {
      results: Array<{ index: number; relevance_score: number; document: any }>;
    };
    const results = data.results.sort((a, b) => a.index - b.index);
    return results.map((result) => result.relevance_score);
  }
}

export default Cangjie;
