"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Lock, Pencil, Check, X } from "lucide-react";
import {
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from "@/actions/expense-categories";
import type { ExpenseCategory } from "@/db/schema";

interface ExpenseCategoryManagerProps {
  categories: ExpenseCategory[];
}

export function ExpenseCategoryManager({
  categories,
}: ExpenseCategoryManagerProps) {
  const router = useRouter();
  const tCat = useTranslations("expenseCategories");

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleStartEdit = (cat: ExpenseCategory) => {
    setEditingId(cat.id);
    setEditingName(cat.isDefault ? tCat(cat.name as Parameters<typeof tCat>[0]) : cat.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleConfirmEdit = async () => {
    if (!editingId) return;
    const result = await updateExpenseCategory(editingId, { name: editingName });
    if (result.success) {
      setEditingId(null);
      setEditingName("");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async (cat: ExpenseCategory) => {
    const result = await deleteExpenseCategory(cat.id);
    if (!result.success) {
      if (result.error === "categoryInUse" || result.error === "categoryIsDefault") {
        toast.error(tCat(result.error as Parameters<typeof tCat>[0]));
      } else {
        toast.error(result.error);
      }
    } else {
      router.refresh();
    }
  };

  const handleAddCategory = async () => {
    if (!newName.trim()) return;
    const result = await createExpenseCategory({ name: newName.trim() });
    if (result.success) {
      setNewName("");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="space-y-1">
      {categories.map((cat) => {
        const displayName = cat.isDefault
          ? tCat(cat.name as Parameters<typeof tCat>[0])
          : cat.name;

        return (
          <div
            key={cat.id}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
          >
            {editingId === cat.id ? (
              <>
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleConfirmEdit();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  className="h-7 text-sm"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={handleConfirmEdit}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={handleCancelEdit}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 truncate">{displayName}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                  onClick={() => handleStartEdit(cat)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {cat.isDefault ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    disabled
                  >
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(cat)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* Add Category row */}
      <div className="flex items-center gap-2 pt-2 border-t mt-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddCategory();
          }}
          placeholder={tCat("categoryName")}
          className="h-8 text-sm"
        />
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={handleAddCategory}
          disabled={!newName.trim()}
        >
          <Plus className="h-3.5 w-3.5" />
          {tCat("addCategory")}
        </Button>
      </div>
    </div>
  );
}
