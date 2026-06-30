"use client";
import { API_URL } from '@/lib/apiUrl';
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { DOMParser as PMDOMParser } from "@tiptap/pm/model";
import { marked } from "marked";
import { useRef, useCallback, useEffect, useState } from "react";
import { useApiRequest } from "@/hooks/useApiRequest";
import {
	Bold, Italic, Heading1, Heading2, Heading3, Heading4,
	List, ListOrdered, Code, Code2, Quote, Image, Minus,
} from "lucide-react";

// ホバー時にNotionライクなツールチップを表示するラッパー
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="relative group inline-flex">
			{children}
			<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-20 shadow-lg">
				{label}
				<div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
			</div>
		</div>
	);
}

function ToolbarButton({
	onClick,
	isActive,
	label,
	children,
}: {
	onClick: () => void;
	isActive?: boolean;
	label: string;
	children: React.ReactNode;
}) {
	return (
		<Tooltip label={label}>
			<button
				type="button"
				onMouseDown={(e) => {
					e.preventDefault();
					onClick();
				}}
				className={`p-1.5 rounded transition-colors cursor-pointer ${
					isActive
						? "bg-indigo-100 text-indigo-700"
						: "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
				}`}
			>
				{children}
			</button>
		</Tooltip>
	);
}

function Separator() {
	return <div className="w-px h-5 bg-slate-200 mx-1 self-center" />;
}

export default function RichTextEditor({
	value,
	onChange,
	placeholder,
}: {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
}) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { executeApi } = useApiRequest();
	const skipNextUpdate = useRef(false);
	const isMarkdownModeRef = useRef(false);
	const [isMarkdownMode, setIsMarkdownMode] = useState(false);

	// DB に &lt;hr&gt; 等のエスケープ済み HTML が混入している場合に対応するため、
	// markdown parser に渡す前にエンティティをデコードする。
	// 例: "&lt;hr&gt;" → "<hr>" → markdown-it (html: true) が生 HTML として保持
	//   → ProseMirror DOMParser が HorizontalRule node に変換
	//   → 次の onUpdate で getMarkdown() がクリーンな Markdown ("---") を出力
	const decodeHtmlEntities = (str: string): string => {
		if (typeof window === "undefined") return str;
		const txt = document.createElement("textarea");
		txt.innerHTML = str;
		return txt.value;
	};

	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit,
			TiptapImage.configure({ inline: false }).extend({
				addStorage() {
					return {
						markdown: {
							// prosemirror-markdown の defaultMarkdownSerializer.nodes.image は
							// closeBlock を呼ばないため、ブロック画像 (inline:false) の直後に
							// 隣接する見出し等が同一行に連結され、次回 round-trip で `\###` の
							// エスケープが入って表示崩れする。ブロック時のみ closeBlock を呼ぶ。
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							serialize(state: any, node: any) {
								state.write(
									"![" + state.esc(node.attrs.alt || "") + "](" +
									node.attrs.src.replace(/[()]/g, "\\$&") +
									(node.attrs.title ? ' "' + node.attrs.title.replace(/"/g, '\\"') + '"' : "") +
									")"
								);
								if (!node.type.isInline) state.closeBlock(node);
							},
							parse: {},
						},
					};
				},
			}),
			Placeholder.configure({
				placeholder: placeholder || "コンテンツを入力してください...",
			}),
			// markdown のパース・シリアライズ両方に使用
			// html: true → markdown 中の生 HTML（<hr>, <h2> 等）を node に変換
			Markdown.configure({
				html: true,
				transformCopiedText: true,
				transformPastedText: true, // 貼り付け時に正しいノードを生成（ロスレス往復）
			}),
		],
		content: "",
		onUpdate({ editor }) {
			skipNextUpdate.current = true;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			onChange((editor.storage as any).markdown.getMarkdown());
		},
		editorProps: {
			attributes: {
				class: "rich-editor-content lesson-content",
			},
		},
	});

	// tiptap-markdown の setContent / insertContentAt は両方とも markdown-it を経由するため、
	// Turbopack の bundling 問題で isSpace エラーが発生する。
	// これを回避するため、marked で markdown → HTML、ProseMirror DOMParser で HTML → node に変換し、
	// editor.view.dispatch で直接 transaction を流して TipTap commands を完全にバイパスする。
	// ※ getMarkdown() (serializer) は markdown-it を使わないため安全。
	const setEditorContent = useCallback((md: string) => {
		if (!editor || editor.isDestroyed) return;
		const decoded = decodeHtmlEntities(md || "");
		const result = marked.parse(decoded);
		const html = typeof result === "string" ? result : "";

		const tempDiv = document.createElement("div");
		tempDiv.innerHTML = html;

		const parser = PMDOMParser.fromSchema(editor.schema);
		const doc = parser.parse(tempDiv);

		const tr = editor.state.tr.replaceWith(
			0,
			editor.state.doc.content.size,
			doc.content
		);
		editor.view.dispatch(tr);
	}, [editor]);

	// 外部からvalueが変わった場合のみエディタを同期（APIロード時など）
	useEffect(() => {
		if (!editor || editor.isDestroyed) return;
		if (isMarkdownModeRef.current) return; // MDモード中はエディタを触らない
		if (skipNextUpdate.current) {
			skipNextUpdate.current = false;
			return;
		}
		setEditorContent(value);
	}, [value, editor, setEditorContent]);

	// リッチモードへ切り替え：最新のvalueをエディタに反映してから表示
	const switchToRich = useCallback(() => {
		if (!editor || editor.isDestroyed) return;
		isMarkdownModeRef.current = false;
		setEditorContent(value);
		setIsMarkdownMode(false);
	// valueを依存に含めることで、常に最新のMD内容を使う
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [editor, value, setEditorContent]);

	// MDモードへ切り替え
	const switchToMarkdown = () => {
		isMarkdownModeRef.current = true;
		setIsMarkdownMode(true);
	};

	const handleImageUpload = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file || !editor) return;

			const formData = new FormData();
			formData.append("file", file);

			const response = await executeApi(
				`${API_URL}/api/files/upload`,
				"POST",
				formData
			);
			if (response?.ok) {
				const filePath = await response.text();
				const imageUrl = `${API_URL}${filePath}`;
				editor.chain().focus().setImage({ src: imageUrl, alt: file.name }).run();
			}
			if (fileInputRef.current) fileInputRef.current.value = "";
		},
		[editor, executeApi]
	);

	if (!editor) return null;

	return (
		<div className="border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-transparent">
			{/* ツールバー（overflow-visible のまま → ツールチップがはみ出せる） */}
			<div className="relative flex items-center flex-wrap gap-0.5 px-3 py-2 bg-slate-50 border-b border-gray-200 rounded-t-xl">
				{/* 書式ボタン（リッチモードのみ操作可能） */}
				<div className={`flex items-center flex-wrap gap-0.5 ${isMarkdownMode ? "opacity-30 pointer-events-none" : ""}`}>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
						isActive={editor.isActive("heading", { level: 1 })}
						label="見出し1"
					>
						<Heading1 size={16} />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
						isActive={editor.isActive("heading", { level: 2 })}
						label="見出し2"
					>
						<Heading2 size={16} />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
						isActive={editor.isActive("heading", { level: 3 })}
						label="見出し3"
					>
						<Heading3 size={16} />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
						isActive={editor.isActive("heading", { level: 4 })}
						label="見出し4"
					>
						<Heading4 size={16} />
					</ToolbarButton>

					<Separator />

					<ToolbarButton
						onClick={() => editor.chain().focus().toggleBold().run()}
						isActive={editor.isActive("bold")}
						label="太字"
					>
						<Bold size={16} />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleItalic().run()}
						isActive={editor.isActive("italic")}
						label="斜体"
					>
						<Italic size={16} />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleCode().run()}
						isActive={editor.isActive("code")}
						label="インラインコード"
					>
						<Code size={16} />
					</ToolbarButton>

					<Separator />

					<ToolbarButton
						onClick={() => editor.chain().focus().toggleBulletList().run()}
						isActive={editor.isActive("bulletList")}
						label="箇条書き"
					>
						<List size={16} />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleOrderedList().run()}
						isActive={editor.isActive("orderedList")}
						label="番号付きリスト"
					>
						<ListOrdered size={16} />
					</ToolbarButton>

					<Separator />

					<ToolbarButton
						onClick={() => editor.chain().focus().toggleBlockquote().run()}
						isActive={editor.isActive("blockquote")}
						label="引用"
					>
						<Quote size={16} />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().toggleCodeBlock().run()}
						isActive={editor.isActive("codeBlock")}
						label="コードブロック"
					>
						<Code2 size={16} />
					</ToolbarButton>
					<ToolbarButton
						onClick={() => editor.chain().focus().setHorizontalRule().run()}
						label="区切り線"
					>
						<Minus size={16} />
					</ToolbarButton>

					<Separator />

					<ToolbarButton
						onClick={() => fileInputRef.current?.click()}
						label="画像を挿入"
					>
						<Image size={16} />
					</ToolbarButton>
				</div>

				{/* モード切り替え（右端）：セグメントコントロール */}
				<div className="ml-auto flex rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
					<Tooltip label="プレビューモードで編集">
						<button
							type="button"
							onMouseDown={(e) => {
								e.preventDefault();
								if (isMarkdownMode) switchToRich();
							}}
							className={`px-2.5 py-1 transition-colors cursor-pointer ${
								!isMarkdownMode
									? "bg-indigo-600 text-white"
									: "text-slate-500 hover:bg-slate-100"
							}`}
						>
							Preview
						</button>
					</Tooltip>
					<Tooltip label="Markdownで直接編集">
						<button
							type="button"
							onMouseDown={(e) => {
								e.preventDefault();
								if (!isMarkdownMode) switchToMarkdown();
							}}
							className={`px-2.5 py-1 transition-colors cursor-pointer ${
								isMarkdownMode
									? "bg-indigo-600 text-white"
									: "text-slate-500 hover:bg-slate-100"
							}`}
						>
							Markdown
						</button>
					</Tooltip>
				</div>
			</div>

			{/* コンテンツエリア（角丸・overflow はここで管理） */}
			<div className="overflow-hidden rounded-b-xl">
				{/* エディタ本体は常にマウント（DOM から外すと ProseMirror が壊れる） */}
				<div className={isMarkdownMode ? "hidden" : ""}>
					<EditorContent editor={editor} className="bg-white" />
				</div>

				{/* MDテキストエリア */}
				{isMarkdownMode && (
					<textarea
						value={value}
						onChange={(e) => onChange(e.target.value)}
						className="w-full bg-white px-5 py-4 text-sm font-mono text-slate-700 leading-relaxed outline-none resize-none"
						style={{ minHeight: "300px" }}
						placeholder="Markdownを入力してください..."
						spellCheck={false}
					/>
				)}
			</div>

			<input
				type="file"
				accept="image/*"
				ref={fileInputRef}
				className="hidden"
				onChange={handleImageUpload}
			/>
		</div>
	);
}
