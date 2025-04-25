import { BaseContextProvider } from "../";
import {
  ContextItem,
  ContextProviderDescription,
  ContextProviderExtras,
} from "../../";
import { retrieveContextItemsFromEmbeddings } from "../retrieval/retrieval";

class CodebaseContextProvider extends BaseContextProvider {
  static description: ContextProviderDescription = {
    title: "codebase",
    displayTitle: "代码库",
    description: "自动索引相关代码",
    type: "normal",
    renderInlineAs: "",
  };

  async getContextItems(
    query: string,
    extras: ContextProviderExtras,
  ): Promise<ContextItem[]> {
    return retrieveContextItemsFromEmbeddings(extras, this.options, undefined);
  }
  async load(): Promise<void> {}
}

export default CodebaseContextProvider;
