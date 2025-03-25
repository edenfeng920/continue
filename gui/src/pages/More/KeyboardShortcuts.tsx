import styled from "styled-components";
import {
  defaultBorderRadius,
  lightGray,
  vscForeground,
} from "../../components";
import { getPlatform, isJetBrains } from "../../util";
import { ToolTip } from "../../components/gui/Tooltip";

const GridDiv = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  grid-gap: 1rem;
  padding: 1rem 0;
  justify-items: center;
  align-items: center;
`;

const StyledKeyDiv = styled.div`
  border: 0.5px solid ${lightGray};
  border-radius: ${defaultBorderRadius};
  padding: 2px;
  color: ${vscForeground};

  width: 16px;
  height: 16px;

  display: flex;
  justify-content: center;
  align-items: center;
`;

const keyToName: { [key: string]: string } = {
  "⌘": "Cmd",
  "⌃": "Ctrl",
  "⇧": "Shift",
  "⏎": "Enter",
  "⌫": "Backspace",
  "⌥": "Option",
  "⎇": "Alt",
};

function KeyDiv({ text }: { text: string }) {
  return (
    <>
      <StyledKeyDiv data-tooltip-id={`header_button_${text}`}>
        {text}
      </StyledKeyDiv>

      <ToolTip id={`header_button_${text}`} place="bottom">
        {keyToName[text]}
      </ToolTip>
    </>
  );
}

interface KeyboardShortcutProps {
  mac: string;
  windows: string;
  description: string;
}

function KeyboardShortcut(props: KeyboardShortcutProps) {
  const shortcut = getPlatform() === "mac" ? props.mac : props.windows;
  return (
    <div className="flex w-full items-center justify-between gap-x-4">
      <span className="text-sm">{props.description}</span>
      <div className="float-right flex gap-2">
        {shortcut.split(" ").map((key, i) => {
          return <KeyDiv key={i} text={key}></KeyDiv>;
        })}
      </div>
    </div>
  );
}

const vscodeShortcuts: KeyboardShortcutProps[] = [
  {
    mac: "⌘ '",
    windows: "⌃ '",
    description: "切换所选择的模型",
  },
  {
    mac: "⌘ I",
    windows: "⌃ I",
    description: "编辑高亮代码",
  },
  {
    mac: "⌘ L",
    windows: "⌃ L",
    description:
      "添加所选代码到新建对话",
  },
  {
    mac: "⌘ ⌫",
    windows: "⌃ ⌫",
    description: "取消响应",
  },
  {
    mac: "⌘ ⇧ I",
    windows: "⌃ ⇧ I",
    description: "切换行内编辑焦点",
  },
  {
    mac: "⌘ ⇧ L",
    windows: "⌃ ⇧ L",
    description:
      "添加所选代码到当前对话",
  },
  {
    mac: "⌘ ⇧ R",
    windows: "⌃ ⇧ R",
    description: "调试终端",
  },
  {
    mac: "⌘ ⇧ ⌫",
    windows: "⌃ ⇧ ⌫",
    description: "变更全部拒绝",
  },
  {
    mac: "⌘ ⇧ ⏎",
    windows: "⌃ ⇧ ⏎",
    description: "变更全部接受",
  },
  {
    mac: "⌥ ⌘ N",
    windows: "Alt ⌃ N",
    description: "变更逐个拒绝",
  },
  {
    mac: "⌥ ⌘ Y",
    windows: "Alt ⌃ Y",
    description: "变更逐个接受",
  },
  {
    mac: "⌘ K ⌘ A",
    windows: "⌃ K ⌃ A",
    description: "启用 / 禁用自动补全",
  },
  {
    mac: "⌘ K ⌘ M",
    windows: "⌃ K ⌃ M",
    description: "在新窗口中打开",
  },
];

const jetbrainsShortcuts: KeyboardShortcutProps[] = [
  {
    mac: "⌘ '",
    windows: "⌃ '",
    description: "Toggle Selected Model",
  },
  {
    mac: "⌘ I",
    windows: "⌃ I",
    description: "Edit highlighted code",
  },
  {
    mac: "⌘ J",
    windows: "⌃ J",
    description:
      "New Chat / New Chat With Selected Code / Close Continue Sidebar If Chat Already In Focus",
  },
  {
    mac: "⌘ ⌫",
    windows: "⌃ ⌫",
    description: "Cancel response",
  },
  {
    mac: "⌘ ⇧ I",
    windows: "⌃ ⇧ I",
    description: "Toggle inline edit focus",
  },
  {
    mac: "⌘ ⇧ J",
    windows: "⌃ ⇧ J",
    description:
      "Focus Current Chat / Add Selected Code To Current Chat / Close Continue Sidebar If Chat Already In Focus",
  },
  {
    mac: "⌘ ⇧ ⌫",
    windows: "⌃ ⇧ ⌫",
    description: "Reject Diff",
  },
  {
    mac: "⌘ ⇧ ⏎",
    windows: "⌃ ⇧ ⏎",
    description: "Accept Diff",
  },
  {
    mac: "⌥ ⇧ J",
    windows: "Alt ⇧ J",
    description: "Quick Input",
  },
  {
    mac: "⌥ ⌘ J",
    windows: "Alt ⌃ J",
    description: "Toggle Sidebar",
  },
];

function KeyboardShortcuts() {
  return (
    <GridDiv>
      {(isJetBrains() ? jetbrainsShortcuts : vscodeShortcuts).map(
        (shortcut, i) => {
          return (
            <KeyboardShortcut
              key={i}
              mac={shortcut.mac}
              windows={shortcut.windows}
              description={shortcut.description}
            />
          );
        },
      )}
    </GridDiv>
  );
}

export default KeyboardShortcuts;
