import {
  ContextItem,
  ContextProviderDescription,
  ContextProviderExtras,
  ContextSubmenuItem,
  LoadSubmenuItemsArgs,
} from "../../index.js";
import { walkDirs } from "../../indexing/walkDir.js";
import {
  getShortestUniqueRelativeUriPaths,
  getUriPathBasename,
} from "../../util/uri.js";
import { BaseContextProvider } from "../index.js";
import { retrieveContextItemsFromEmbeddings } from "../retrieval/retrieval.js";

class FolderContextProvider extends BaseContextProvider {
  static description: ContextProviderDescription = {
    title: "folder",
    displayTitle: "文件夹",
    description: "输入文件夹名称",
    type: "submenu",
    dependsOnIndexing: true,
  };

  async getContextItems(
    query: string,
    extras: ContextProviderExtras,
  ): Promise<ContextItem[]> {
    return retrieveContextItemsFromEmbeddings(extras, this.options, query);
  }
  async loadSubmenuItems(
    args: LoadSubmenuItemsArgs,
  ): Promise<ContextSubmenuItem[]> {
    const workspaceDirs = await args.ide.getWorkspaceDirs();
    const folders = await walkDirs(
      args.ide,
      {
        onlyDirs: true,
      },
      workspaceDirs,
    );
    const withUniquePaths = getShortestUniqueRelativeUriPaths(
      folders,
      workspaceDirs,
    );

    return withUniquePaths.map((folder) => {
      return {
        id: folder.uri,
        title: getUriPathBasename(folder.uri),
        description: folder.uniquePath,
      };
    });
  }
}

export default FolderContextProvider;
