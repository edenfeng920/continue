import {
  ArrowTopRightOnSquareIcon,
  DocumentArrowUpIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import DocsIndexingStatuses from "../../components/indexing/DocsIndexingStatuses";
import PageHeader from "../../components/PageHeader";
import { IdeMessengerContext } from "../../context/IdeMessenger";
import { useNavigationListener } from "../../hooks/useNavigationListener";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { saveCurrentSession } from "../../redux/thunks/session";
import IndexingProgress from "./IndexingProgress";
import KeyboardShortcuts from "./KeyboardShortcuts";
import MoreHelpRow from "./MoreHelpRow";

function MorePage() {
  useNavigationListener();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const ideMessenger = useContext(IdeMessengerContext);
  const disableIndexing = useAppSelector(
    (state) => state.config.config.disableIndexing,
  );

  return (
    <div className="overflow-y-scroll">
      <PageHeader onTitleClick={() => navigate("/")} title="返回对话" />

      <div className="gap-2 divide-x-0 divide-y-2 divide-solid divide-zinc-700 px-4">
        {/* <div className="py-5">
          <div>
            <h3 className="mx-auto mb-1 mt-0 text-xl">@codebase index</h3>
            <span className="w-3/4 text-xs text-stone-500">
              Local embeddings of your codebase
            </span>
          </div>
          {disableIndexing ? (
            <div className="pb-2 pt-5 text-center font-semibold">
              Indexing is disabled
            </div>
          ) : (
            <IndexingProgress />
          )}
        </div> */}

        {/* <div className="flex flex-col py-5">
          <DocsIndexingStatuses />
        </div> */}

        <div className="py-5">
          <h3 className="mb-4 mt-0 text-xl">数据统计</h3>
          <div className="-mx-4 flex flex-col">
            <MoreHelpRow
              title="Token用量统计"
              description="按日、按模型统计Token用量"
              Icon={TableCellsIcon}
              onClick={() => navigate("/stats")}
            />
          </div>
        </div>

        <div>
          <h3 className="mx-auto mb-1 text-lg">快捷键</h3>
          <KeyboardShortcuts />
        </div>
      </div>
    </div>
  );
}

export default MorePage;
