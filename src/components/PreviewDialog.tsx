import { useEffect } from "react";
import { Transaction, TransactionPreview } from "@/types/api";
import UploadPreview from "./UploadPreview";

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewData: { transactions?: TransactionPreview[] };
  onSave: () => void;
  isSaving: boolean;
  editableTransactions: TransactionPreview[];
  onTransactionUpdate: (
    index: number,
    field: keyof TransactionPreview,
    value: string,
  ) => void;
}

export default function PreviewDialog({
  open,
  onOpenChange,
  previewData,
  onSave,
  isSaving,
  editableTransactions,
  onTransactionUpdate,
}: PreviewDialogProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => !isSaving && onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-6xl bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">
              交易预览 ({previewData?.transactions?.length || 0} 条记录)
            </h2>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <UploadPreview
              expenses={editableTransactions.map((txn, index) => ({
                ...txn,
                id: index.toString(),
                onUpdate: (field: keyof TransactionPreview, value: string) =>
                  onTransactionUpdate(index, field, value),
              }))}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  保存中...
                </>
              ) : (
                "确认保存"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
