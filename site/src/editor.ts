import { EditorView, basicSetup } from "codemirror";
import { go } from "@codemirror/lang-go";

const theme = EditorView.theme({
  "&": { backgroundColor: "var(--paper)", color: "var(--ink)" },
  ".cm-content": { caretColor: "var(--ink)", fontFamily: "var(--mono)" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--ink)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: "#dcdcd4",
  },
  ".cm-activeLine": { backgroundColor: "rgba(0, 0, 0, 0.02)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent" },
});

export function createEditor(
  parent: HTMLElement,
  doc: string,
  onChange?: (doc: string) => void,
  onPaste?: () => void,
): EditorView {
  const extensions = [basicSetup, go(), theme];
  if (onChange || onPaste) {
    extensions.push(
      EditorView.updateListener.of((update) => {
        if (onChange && update.docChanged) onChange(update.state.doc.toString());
        if (onPaste && update.transactions.some((tr) => tr.isUserEvent("input.paste"))) {
          onPaste();
        }
      }),
    );
  }
  return new EditorView({ doc, extensions, parent });
}
