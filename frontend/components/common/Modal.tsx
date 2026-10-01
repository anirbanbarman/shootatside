import { useId, type ReactNode } from "react";
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { IconActionButton } from "@/components/common/ui";

interface ModalProps {
  title: ReactNode;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function Modal({ title, open, onClose, children, actions, className }: ModalProps) {
  const titleId = useId();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" aria-labelledby={titleId} slotProps={{ paper: { className: `mui-dialog-paper ${className ?? ""}` }, backdrop: { className: "mui-dialog-backdrop" } }}>
      <DialogTitle id={titleId} className="mui-dialog-title"><Box className="mui-dialog-heading"><Typography component="span" variant="h6">{title}</Typography><IconActionButton onClick={onClose} aria-label="Close dialog"><CloseIcon /></IconActionButton></Box></DialogTitle>
      <DialogContent dividers className="mui-dialog-content">{children}</DialogContent>
      {actions ? <DialogActions className="mui-dialog-actions">{actions}</DialogActions> : null}
    </Dialog>
  );
}
