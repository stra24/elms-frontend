"use client";
import { API_URL } from '@/lib/apiUrl';
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useApiRequest } from "@/hooks/useApiRequest";
import { GRADIENT_PRIMARY, GRADIENT_PRIMARY_HOVER, GRADIENT_ACCENT } from "@/lib/gradients";
import { pageContainer } from "@/lib/pageLayout";
import { NewsDto } from "../types";
import { convertDateStringOrToday } from '@/lib/dateUtil';

interface NewsDetailProps {
  newsId?: number;
  // 新規作成であるか（true: 新規作成、false: 更新）
  isNew: boolean;
}

export default function NewsDetail(props: NewsDetailProps) {
  // お知らせ新規作成API
  const { executeApi: executeCreateNewsApi } = useApiRequest();

  // お知らせ更新API
  const { executeApi: executeUpdateNewsApi } = useApiRequest();

  const router = useRouter();

  const newsId = props.newsId;

  // 新規作成画面であるか
  const isNew = usePathname() === "/admin/news/new";

  // お知らせ削除API
  const { executeApi: executeDeleteNewsApi } = useApiRequest();

  // 画面に表示するstate
  const [createdAt, setCreatedAt] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [hasFetched, setHasFetched] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleUpdate = async () => {
    try {
      if (isNew) {
        const createNewsApiResponse = await executeCreateNewsApi(
          `${API_URL}/api/news`,
          "POST",
          {
            title,
            content
          }
        );

        if (!createNewsApiResponse?.ok) {
          throw new Error("news新規作成 - 失敗");
        }
      } else {
        // News情報を更新する
        const updateNewsApiResponse = await executeUpdateNewsApi(
          `${API_URL}/api/news/${newsId}`,
          "PUT",
          {
            newsId,
            title,
            content
          }
        );

        if (!updateNewsApiResponse?.ok) {
          throw new Error("news更新 - 失敗");
        }
      }
      router.push("/admin/news");
    } catch (error) {
      console.error(error);
      alert("保存に失敗しました");
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    if (confirm("本当に削除しますか？")) {
      // 削除API呼び出し予定
      e.stopPropagation();
      await executeDeleteNewsApi(
        `${API_URL}/api/news/${newsId}`,
        "DELETE"
      );
      router.push("/admin/news");
    }
  };

  // お知らせ取得API
  const {
    executeApi: executeFindNewsByIdApi,
    isLoading: isLoadingFindNewsByIdApi,
  } = useApiRequest();

  // バックエンドサイドへリクエストを送信する(更新画面での処理)
  useEffect(() => {
    if (!newsId) {
      return;
    }

    setHasFetched(false);
    setNotFound(false);

    const fetchNews = async () => {
      const response = await executeFindNewsByIdApi(
        `${API_URL}/api/news/${newsId}`,
        "GET"
      );
      if (response?.ok) {
        const newsDto: NewsDto = await response.json();
        setTitle(newsDto.title);
        setContent(newsDto.content);
        setCreatedAt(newsDto.createdAt);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
      setHasFetched(true);
    };

    fetchNews();
  }, [executeFindNewsByIdApi, newsId]);

  if (!props.isNew && !hasFetched && isLoadingFindNewsByIdApi) {
    return (
      <div className={`${pageContainer.adminNarrow} py-8`}>
        <div className="flex items-center gap-3 mb-8">
          <span className={`block w-1 h-8 rounded-full bg-gradient-to-b ${GRADIENT_ACCENT} shrink-0`} />
          <h1 className="text-2xl font-bold text-slate-800">お知らせ詳細</h1>
        </div>
        <p className="text-center mt-10 text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!props.isNew && hasFetched && notFound) {
    return (
      <div className={`${pageContainer.adminNarrow} py-8`}>
        <div className="flex items-center gap-3 mb-8">
          <span className={`block w-1 h-8 rounded-full bg-gradient-to-b ${GRADIENT_ACCENT} shrink-0`} />
          <h1 className="text-2xl font-bold text-slate-800">お知らせ詳細</h1>
        </div>
        <p className="text-center mt-10 text-gray-500">
          お知らせが見つかりませんでした。
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className={`${pageContainer.adminNarrow} py-8`}>
        <div className="flex items-center gap-3 mb-8">
          <span className={`block w-1 h-8 rounded-full bg-gradient-to-b ${GRADIENT_ACCENT} shrink-0`} />
          <h1 className="text-2xl font-bold text-slate-800">お知らせ詳細</h1>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">日付</label>
            <p className="text-sm text-slate-600">{convertDateStringOrToday(createdAt)}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">本文</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleUpdate}
              className={`bg-gradient-to-r ${GRADIENT_PRIMARY} text-white px-7 py-2.5 rounded-xl ${GRADIENT_PRIMARY_HOVER} transition-all cursor-pointer text-sm font-semibold shadow-md shadow-indigo-200`}
            >
              保存
            </button>
            {!props.isNew && (
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-7 py-2.5 rounded-xl hover:bg-red-600 transition-colors cursor-pointer text-sm font-semibold"
              >
                削除
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
