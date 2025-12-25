import { useEffect } from "react";

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children?: React.ReactNode;
}

export default function PreviewDialog({
  open,
  onOpenChange,
  title,
  children,
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
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-6xl bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
          {/* Header */}
          {title && (
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">{title}</h2>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
            >
              知道了
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
