type PagenationProps = {
    handlePrevPage: () => void;
    pageNum: number;
    totalPageNum: number;
    handleNextPage: () => void;
};

export default function SimplePagenation({ handlePrevPage, pageNum, totalPageNum, handleNextPage }: PagenationProps) {
    return (
        <div className="flex items-center justify-center mt-6 gap-3">
            <button
                onClick={handlePrevPage}
                disabled={pageNum == 1}
                className="px-4 py-1.5 text-sm font-medium bg-white border border-blue-200 text-blue-600 rounded-xl enabled:hover:bg-blue-50 enabled:cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                前へ
            </button>
            <span className="text-sm font-medium text-slate-600">
                {pageNum} / {totalPageNum} ページ
            </span>
            <button
                onClick={handleNextPage}
                disabled={pageNum === totalPageNum}
                className="px-4 py-1.5 text-sm font-medium bg-white border border-blue-200 text-blue-600 rounded-xl enabled:hover:bg-blue-50 enabled:cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                次へ
            </button>
        </div>
    );
}
