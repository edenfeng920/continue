// @ts-ignore
import nlp from "wink-nlp-utils";
// 添加中文分词器
import Segment from 'segment';

import { BranchAndDir, Chunk, ContinueConfig, IDE, ILLM } from "../../../";
import { chunkDocument } from "../../../indexing/chunk/chunk";
import { FullTextSearchCodebaseIndex } from "../../../indexing/FullTextSearchCodebaseIndex";
import { LanceDbIndex } from "../../../indexing/LanceDbIndex";
import { recentlyEditedFilesCache } from "../recentlyEditedFilesCache";

// 创建 Segment 实例
const segment = new Segment();

// 使用默认的识别模块及字典,注意字典文件需保存至extensions\vscode\segment目录下
segment.useDefault();
segment.loadStopwordDict('stopword.txt');

export interface RetrievalPipelineOptions {
  llm: ILLM;
  config: ContinueConfig;
  ide: IDE;
  input: string;
  nRetrieve: number;
  nFinal: number;
  tags: BranchAndDir[];
  filterDirectory?: string;
  includeEmbeddings?: boolean; // Used to handle JB w/o an embeddings model
}

export interface RetrievalPipelineRunArguments {
  query: string;
  tags: BranchAndDir[];
  filterDirectory?: string;
}

export interface IRetrievalPipeline {
  run(args: RetrievalPipelineRunArguments): Promise<Chunk[]>;
}

export default class BaseRetrievalPipeline implements IRetrievalPipeline {
  private ftsIndex = new FullTextSearchCodebaseIndex();
  private lanceDbIndex: LanceDbIndex;

  constructor(protected readonly options: RetrievalPipelineOptions) {
    this.lanceDbIndex = new LanceDbIndex(
      options.config.embeddingsProvider,
      (uri) => options.ide.readFile(uri),
    );
  }

  private getCleanedTrigrams(
    query: RetrievalPipelineRunArguments["query"],
  ): string[] {
    let text = nlp.string.removeExtraSpaces(query);
    let tokens: string[] = [];
    
    //判断query中是否包含中文
    const hasChinese = /[\u4e00-\u9fa5]/.test(text);
    if (hasChinese) {
      tokens = segment.doSegment(text, {
        stripPunctuation: true,
        stripStopword: true,
        simple: true
      });
    } else {
      text = nlp.string.stem(text);
      tokens = nlp.string.tokenize(text, true)
       .filter((token: any) => token.tag === "word")
       .map((token: any) => token.value);
    }
    
    // 去除英文停用词
    tokens = nlp.tokens.removeWords(tokens);
    // 去除重复词
    tokens = nlp.tokens.setOfWords(tokens);

    const cleanedTokens = [...tokens].join(" ");
    const trigrams = nlp.string.ngram(cleanedTokens, 3);

    return trigrams;
  }

  protected async retrieveFts(
    args: RetrievalPipelineRunArguments,
    n: number,
  ): Promise<Chunk[]> {
    try {
      if (args.query.trim() === "") {
        return [];
      }

      const tokens = this.getCleanedTrigrams(args.query).join(" OR ");

      return await this.ftsIndex.retrieve({
        n,
        text: tokens,
        tags: args.tags,
        directory: args.filterDirectory,
      });
    } catch (e) {
      console.warn("Error retrieving from FTS:", e);
      return [];
    }
  }

  protected async retrieveAndChunkRecentlyEditedFiles(
    n: number,
  ): Promise<Chunk[]> {
    const recentlyEditedFilesSlice = Array.from(
      recentlyEditedFilesCache.keys(),
    ).slice(0, n);

    // If the number of recently edited files is less than the retrieval limit,
    // include additional open files. This is useful in the case where a user
    // has many tabs open and reloads their IDE. They now have 0 recently edited files,
    // but many open tabs that represent what they were working on prior to reload.
    if (recentlyEditedFilesSlice.length < n) {
      const openFiles = await this.options.ide.getOpenFiles();
      recentlyEditedFilesSlice.push(
        ...openFiles.slice(0, n - recentlyEditedFilesSlice.length),
      );
    }

    const chunks: Chunk[] = [];

    for (const filepath of recentlyEditedFilesSlice) {
      const contents = await this.options.ide.readFile(filepath);
      const fileChunks = chunkDocument({
        filepath,
        contents,
        maxChunkSize:
          this.options.config.embeddingsProvider.maxEmbeddingChunkSize,
        digest: filepath,
      });

      for await (const chunk of fileChunks) {
        chunks.push(chunk);
      }
    }

    return chunks.slice(0, n);
  }

  protected async retrieveEmbeddings(
    input: string,
    n: number,
  ): Promise<Chunk[]> {
    return this.lanceDbIndex.retrieve(
      input,
      n,
      this.options.tags,
      this.options.filterDirectory,
    );
  }

  run(args: RetrievalPipelineRunArguments): Promise<Chunk[]> {
    throw new Error("Not implemented");
  }
}
