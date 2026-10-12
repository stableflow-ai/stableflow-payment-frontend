import { useEffect, useState } from "react";
import { IconCopy } from "@stableflow/pay-ui/icons/outline/copy";
import { Button } from "@stableflow/pay-ui/button";
import { BUTTON_SIZE } from "@stableflow/pay-ui/button";
import { Dialog } from "@stableflow/pay-ui/dialog";
import useToast from "@/hooks/use-toast";
import { API_KEY_DIALOG_MODE, API_KEY_LABEL_MAX_LENGTH, type ApiKeyDialogMode } from "../config";
import { apiKeysError } from "../utils";

type ApiKeyDialogProps = {
  open: boolean;
  mode: ApiKeyDialogMode;
  initialLabel?: string;
  onClose: () => void;
  onCreate: (label: string) => Promise<string>;
  onUpdate: (label: string) => Promise<void>;
};

export function ApiKeyDialog(props: ApiKeyDialogProps) {
  const { open, mode, initialLabel = "", onClose, onCreate, onUpdate } = props;
  const toast = useToast();
  const [label, setLabel] = useState(initialLabel);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLabel(initialLabel);
    setCreatedKey(null);
    setSubmitting(false);
  }, [open, initialLabel]);

  const isEdit = mode === API_KEY_DIALOG_MODE.Edit;
  const title = isEdit ? "Edit API Key" : "Create New API Key";

  const copyKey = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success({ title: "Copied" });
    } catch {
      toast.fail({ title: "Could not copy" });
    }
  };

  const submitLabel = async () => {
    const next = label.trim();
    if (!next) {
      toast.fail({ title: "Key label is required" });
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit) {
        await onUpdate(next);
        onClose();
        return;
      }
      setCreatedKey(await onCreate(next));
    } catch (error) {
      toast.fail({
        title: apiKeysError(error, isEdit ? "Could not update API key" : "Could not create API key"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={title} closeOnMaskClick={!submitting}>
      {createdKey ? (
        <div className="flex flex-col gap-5">
          <p className="font-montserrat text-sm font-medium text-[#606060]">
            Notice: Do not share your API key with others, or expose it in the browser or other
            client-side code.
          </p>
          <div className="flex flex-col gap-1.5 bg-[#FDFDFD] rounded-[20px] py-4 px-4 border border-[#fff] shadow-[0_0_20px_0_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 break-all font-montserrat text-sm font-medium text-black">
                {createdKey}
              </p>
              <Button
                size={BUTTON_SIZE.Sm}
                className="h-[30px] shrink-0 rounded-[8px] px-3"
                onClick={() => {
                  void copyKey(createdKey);
                }}
              >
                <IconCopy className="size-3 shrink-0 text-white" />
                Copy
              </Button>
            </div>
          </div>
          <Button
            size={BUTTON_SIZE.Lg}
            className="w-full"
            onClick={() => onClose()}
          >
            Done
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="api-key-label" className="font-montserrat text-sm font-medium text-[#606060]">
              Key Label
            </label>
            <input
              id="api-key-label"
              type="text"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Name of API key"
              maxLength={API_KEY_LABEL_MAX_LENGTH}
              className="h-9 w-full rounded-[6px] border border-[#e3e3e3] bg-[#f6f6f6] px-3 font-montserrat text-sm font-medium text-black outline-none placeholder:text-black/30 focus:border-[#c8c8c8]"
            />
          </div>
          <Button size={BUTTON_SIZE.Lg} className="w-full" loading={submitting} onClick={() => void submitLabel()}>
            {isEdit ? "Update" : "Create"}
          </Button>
        </div>
      )}
    </Dialog>
  );
}
