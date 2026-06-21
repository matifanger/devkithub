/**
 * Kanban Board
 *
 * A Trello-style drag-and-drop Kanban board for organizing tasks and projects.
 *
 * Features:
 * - Drag & drop cards between columns
 * - Drag & drop to reorder columns
 * - Trello-style card detail modal with inline editing
 * - Checklist per card
 * - Color labels
 * - Auto-save on blur
 * - Persistent state across sessions
 *
 * How to use:
 * 1. Add columns to organize your workflow
 * 2. Create cards within columns
 * 3. Drag cards between columns to change status
 * 4. Click a card to open its detail view
 * 5. Add checklists and descriptions
 */
import React, { useCallback, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CheckSquare,
  ListChecks,
  Plus,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { ToolClearButton } from "../components/tool-actions";
import {
  ToolPageContainer,
  ToolPageHeader,
} from "../components/tool-page-layout";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { useToolState } from "../hooks/useToolState";

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface KanbanCard {
  id: string;
  content: string;
  description: string;
  checklist: ChecklistItem[];
  color: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

interface KanbanState {
  columns: KanbanColumn[];
}

const COLORS = [
  "",
  "bg-blue-500/20 border-blue-500/40",
  "bg-green-500/20 border-green-500/40",
  "bg-yellow-500/20 border-yellow-500/40",
  "bg-red-500/20 border-red-500/40",
  "bg-purple-500/20 border-purple-500/40",
  "bg-pink-500/20 border-pink-500/40",
  "bg-cyan-500/20 border-cyan-500/40",
];

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: "todo", title: "To Do", cards: [] },
  { id: "in-progress", title: "In Progress", cards: [] },
  { id: "done", title: "Done", cards: [] },
];

const initialState: KanbanState = { columns: DEFAULT_COLUMNS };

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

// --- Sortable Card ---

function SortableCard({
  card,
  onDelete,
  onClick,
}: {
  card: KanbanCard;
  onDelete: () => void;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const checklist = card.checklist || [];
  const checkDone = checklist.filter((i) => i.checked).length;
  const checkTotal = checklist.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group rounded-lg border p-3 shadow-sm transition-all hover:shadow-md cursor-grab active:cursor-grabbing ${card.color || "bg-card border-border"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={onClick}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-medium break-words">{card.content}</p>
          {card.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {card.description}
            </p>
          )}
          {checkTotal > 0 && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <ListChecks className="h-3 w-3" />
              <span className={checkDone === checkTotal ? "text-green-500" : ""}>
                {checkDone}/{checkTotal}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-destructive transition-opacity shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// --- Card Overlay (shown while dragging) ---

function CardOverlay({ card }: { card: KanbanCard }) {
  return (
    <div className={`w-[260px] rounded-lg border p-3 shadow-xl rotate-2 ${card.color || "bg-card border-border"}`}>
      <p className="text-sm font-medium break-words">{card.content}</p>
      {card.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{card.description}</p>
      )}
    </div>
  );
}

// --- Sortable Column ---

function SortableColumn({
  column,
  onAddCard,
  onDeleteCard,
  onOpenCard,
  onDeleteColumn,
  onEditTitle,
}: {
  column: KanbanColumn;
  onAddCard: (columnId: string, content: string, color: string) => void;
  onDeleteCard: (columnId: string, cardId: string) => void;
  onOpenCard: (card: KanbanCard, columnId: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onEditTitle: (columnId: string, title: string) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCardContent, setNewCardContent] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(column.title);

  const { setNodeRef: setDropRef } = useDroppable({ id: column.id });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `col-${column.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleAdd = () => {
    if (newCardContent.trim()) {
      onAddCard(column.id, newCardContent.trim(), selectedColor);
      setNewCardContent("");
      setSelectedColor("");
      setIsAdding(false);
    }
  };

  const handleTitleSave = () => {
    if (titleValue.trim()) onEditTitle(column.id, titleValue.trim());
    setIsEditingTitle(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col w-[280px] min-w-[280px] rounded-xl border bg-muted/30 shadow-sm"
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        {isEditingTitle ? (
          <Input
            autoFocus
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleSave();
              if (e.key === "Escape") setIsEditingTitle(false);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="h-7 text-sm font-semibold"
          />
        ) : (
          <h3
            className="text-sm font-semibold cursor-pointer select-none"
            onClick={() => {
              setTitleValue(column.title);
              setIsEditingTitle(true);
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {column.title}
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              {column.cards.length}
            </span>
          </h3>
        )}
        <button
          onClick={() => onDeleteColumn(column.id)}
          onPointerDown={(e) => e.stopPropagation()}
          className="text-muted-foreground/50 hover:text-destructive transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        ref={setDropRef}
        className="flex-1 p-2 space-y-2 min-h-[80px] overflow-y-auto max-h-[calc(100vh-16rem)]"
      >
        <SortableContext items={column.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {column.cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              onDelete={() => onDeleteCard(column.id, card.id)}
              onClick={() => onOpenCard(card, column.id)}
            />
          ))}
        </SortableContext>
      </div>

      <div className="p-2 border-t">
        {isAdding ? (
          <div className="space-y-2">
            <Input
              autoFocus
              value={newCardContent}
              onChange={(e) => setNewCardContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") setIsAdding(false);
              }}
              placeholder="Card title..."
              className="h-8 text-sm"
            />
            <div className="flex items-center gap-1">
              {COLORS.map((color, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedColor(color)}
                  className={`w-4 h-4 rounded-full border-2 transition-transform ${
                    color || "bg-muted border-border"
                  } ${selectedColor === color ? "scale-125 ring-1 ring-primary" : ""}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleAdd} className="h-7 text-xs">
                Add
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="h-7 text-xs">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-muted-foreground"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add card
          </Button>
        )}
      </div>
    </div>
  );
}

// --- Card Detail Modal (Trello-style) ---

function CardDetailModal({
  card,
  columnId,
  columnTitle,
  onUpdate,
  onClose,
}: {
  card: KanbanCard;
  columnId: string;
  columnTitle: string;
  onUpdate: (columnId: string, cardId: string, updates: Partial<KanbanCard>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(card.content);
  const [desc, setDesc] = useState(card.description);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(card.checklist || []);
  const [color, setColor] = useState(card.color);
  const [newCheckItem, setNewCheckItem] = useState("");
  const checkInputRef = useRef<HTMLInputElement>(null);

  const save = useCallback(() => {
    onUpdate(columnId, card.id, {
      content: title.trim() || card.content,
      description: desc,
      checklist,
      color,
    });
  }, [title, desc, checklist, color, columnId, card.id, card.content, onUpdate]);

  const handleTitleBlur = () => save();
  const handleDescBlur = () => save();

  const toggleCheck = (itemId: string) => {
    const updated = checklist.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i));
    setChecklist(updated);
    onUpdate(columnId, card.id, { checklist: updated });
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    const updated = [...checklist, { id: generateId(), text: newCheckItem.trim(), checked: false }];
    setChecklist(updated);
    setNewCheckItem("");
    onUpdate(columnId, card.id, { checklist: updated });
    checkInputRef.current?.focus();
  };

  const removeCheckItem = (itemId: string) => {
    const updated = checklist.filter((i) => i.id !== itemId);
    setChecklist(updated);
    onUpdate(columnId, card.id, { checklist: updated });
  };

  const checkDone = checklist.filter((i) => i.checked).length;
  const checkTotal = checklist.length;
  const progress = checkTotal > 0 ? (checkDone / checkTotal) * 100 : 0;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            in <span className="font-medium text-foreground">{columnTitle}</span>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="text-lg font-semibold bg-transparent border-none outline-none w-full focus:ring-1 focus:ring-primary/30 rounded px-1 -ml-1"
          />
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Color Label */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Label</p>
            <div className="flex items-center gap-2">
              {COLORS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setColor(c);
                    onUpdate(columnId, card.id, { color: c });
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    c || "bg-muted border-border"
                  } ${color === c ? "scale-125 ring-2 ring-primary" : "hover:scale-110"}`}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</p>
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onBlur={handleDescBlur}
              placeholder="Add a more detailed description..."
              className="min-h-[160px] text-sm resize-y"
            />
          </div>

          {/* Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <ListChecks className="h-3.5 w-3.5" /> Checklist
              </p>
              {checkTotal > 0 && (
                <span className="text-xs text-muted-foreground">{checkDone}/{checkTotal}</span>
              )}
            </div>

            {checkTotal > 0 && (
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            <div className="space-y-1">
              {checklist.map((item) => (
                <div key={item.id} className="group flex items-center gap-2 py-1 px-1 rounded hover:bg-muted/50">
                  <button onClick={() => toggleCheck(item.id)} className="shrink-0">
                    {item.checked ? (
                      <CheckSquare className="h-4 w-4 text-green-500" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <span className={`text-sm flex-1 ${item.checked ? "line-through text-muted-foreground" : ""}`}>
                    {item.text}
                  </span>
                  <button
                    onClick={() => removeCheckItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Input
                ref={checkInputRef}
                value={newCheckItem}
                onChange={(e) => setNewCheckItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addCheckItem();
                }}
                placeholder="Add item..."
                className="h-8 text-sm flex-1"
              />
              <Button size="sm" variant="outline" onClick={addCheckItem} className="h-8 text-xs shrink-0">
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Main Kanban Page ---

export function KanbanPage() {
  const [state, setState, clearState] = useToolState("kanban", initialState);
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [openCard, setOpenCard] = useState<{ card: KanbanCard; columnId: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "card" | "column"; id: string; columnId?: string } | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const findCardColumn = useCallback((cardId: string, columns: KanbanColumn[]) => {
    for (const col of columns) {
      if (col.cards.some((c) => c.id === cardId)) return col.id;
    }
    return null;
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;

    if (id.startsWith("col-")) {
      setActiveColumnId(id.replace("col-", ""));
      return;
    }

    for (const col of state.columns) {
      const card = col.cards.find((c) => c.id === id);
      if (card) {
        setActiveCard(card);
        break;
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId.startsWith("col-")) return;

    setState((prev) => {
      const activeColId = findCardColumn(activeId, prev.columns);
      let overColId = findCardColumn(overId, prev.columns);

      if (!overColId) {
        overColId = prev.columns.find((c) => c.id === overId)?.id || null;
      }

      if (!activeColId || !overColId || activeColId === overColId) return prev;

      const cols = prev.columns.map((col) => ({ ...col, cards: [...col.cards] }));
      const sourceCol = cols.find((c) => c.id === activeColId)!;
      const destCol = cols.find((c) => c.id === overColId)!;

      const cardIndex = sourceCol.cards.findIndex((c) => c.id === activeId);
      if (cardIndex === -1) return prev;

      const [card] = sourceCol.cards.splice(cardIndex, 1);

      const overIndex = destCol.cards.findIndex((c) => c.id === overId);
      if (overIndex >= 0) {
        destCol.cards.splice(overIndex, 0, card);
      } else {
        destCol.cards.push(card);
      }

      return { columns: cols };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);
    setActiveColumnId(null);

    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId.startsWith("col-") && overId.startsWith("col-")) {
      const fromColId = activeId.replace("col-", "");
      const toColId = overId.replace("col-", "");
      setState((prev) => {
        const oldIndex = prev.columns.findIndex((c) => c.id === fromColId);
        const newIndex = prev.columns.findIndex((c) => c.id === toColId);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return { columns: arrayMove(prev.columns, oldIndex, newIndex) };
      });
      return;
    }

    setState((prev) => {
      const activeColId = findCardColumn(activeId, prev.columns);
      const overColId = findCardColumn(overId, prev.columns);

      if (!activeColId || !overColId || activeColId !== overColId) return prev;

      const cols = prev.columns.map((col) => {
        if (col.id !== activeColId) return col;
        const oldIdx = col.cards.findIndex((c) => c.id === activeId);
        const newIdx = col.cards.findIndex((c) => c.id === overId);
        if (oldIdx === -1 || newIdx === -1) return col;
        return { ...col, cards: arrayMove(col.cards, oldIdx, newIdx) };
      });
      return { columns: cols };
    });
  };

  const addCard = useCallback(
    (columnId: string, content: string, color: string) => {
      setState((prev) => ({
        columns: prev.columns.map((col) =>
          col.id === columnId
            ? { ...col, cards: [...col.cards, { id: generateId(), content, description: "", checklist: [], color }] }
            : col,
        ),
      }));
    },
    [setState],
  );

  const deleteCard = useCallback(
    (columnId: string, cardId: string) => {
      setState((prev) => ({
        columns: prev.columns.map((col) =>
          col.id === columnId ? { ...col, cards: col.cards.filter((c) => c.id !== cardId) } : col,
        ),
      }));
    },
    [setState],
  );

  const updateCard = useCallback(
    (columnId: string, cardId: string, updates: Partial<KanbanCard>) => {
      setState((prev) => ({
        columns: prev.columns.map((col) =>
          col.id === columnId
            ? { ...col, cards: col.cards.map((c) => (c.id === cardId ? { ...c, ...updates } : c)) }
            : col,
        ),
      }));
    },
    [setState],
  );

  const deleteColumn = useCallback(
    (columnId: string) => {
      setState((prev) => ({ columns: prev.columns.filter((c) => c.id !== columnId) }));
    },
    [setState],
  );

  const editColumnTitle = useCallback(
    (columnId: string, title: string) => {
      setState((prev) => ({
        columns: prev.columns.map((c) => (c.id === columnId ? { ...c, title } : c)),
      }));
    },
    [setState],
  );

  const addColumn = useCallback(() => {
    const title = newColumnTitle.trim() || "New Column";
    setState((prev) => ({
      columns: [...prev.columns, { id: generateId(), title, cards: [] }],
    }));
    setNewColumnTitle("");
  }, [newColumnTitle, setState]);

  const columnIds = state.columns.map((c) => `col-${c.id}`);

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="Kanban Board"
        description="Drag & drop task board for organizing your workflow"
      />

      <div className="flex items-center gap-3">
        <Input
          value={newColumnTitle}
          onChange={(e) => setNewColumnTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addColumn()}
          placeholder="New column name..."
          className="w-[200px] h-8 text-sm"
        />
        <Button variant="outline" size="sm" onClick={addColumn}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Column
        </Button>
        <ToolClearButton onClear={() => clearState()} />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-14rem)]">
            {state.columns.map((column) => (
              <SortableColumn
                key={column.id}
                column={column}
                onAddCard={addCard}
                onDeleteCard={(colId, cardId) =>
                  setDeleteConfirm({ type: "card", id: cardId, columnId: colId })
                }
                onOpenCard={(card, colId) => setOpenCard({ card, columnId: colId })}
                onDeleteColumn={(colId) => setDeleteConfirm({ type: "column", id: colId })}
                onEditTitle={editColumnTitle}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeCard && <CardOverlay card={activeCard} />}
          {activeColumnId && (
            <div className="w-[280px] h-[200px] rounded-xl border-2 border-dashed border-primary/30 bg-primary/5" />
          )}
        </DragOverlay>
      </DndContext>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>
              Delete {deleteConfirm?.type === "column" ? "Column" : "Card"}
            </DialogTitle>
            <DialogDescription>
              {deleteConfirm?.type === "column"
                ? "This will delete the column and all its cards. This action cannot be undone."
                : "This card will be permanently removed. This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (deleteConfirm?.type === "column") {
                  deleteColumn(deleteConfirm.id);
                } else if (deleteConfirm?.type === "card" && deleteConfirm.columnId) {
                  deleteCard(deleteConfirm.columnId, deleteConfirm.id);
                }
                setDeleteConfirm(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Card Detail Modal */}
      {openCard && (
        <CardDetailModal
          card={openCard.card}
          columnId={openCard.columnId}
          columnTitle={state.columns.find((c) => c.id === openCard.columnId)?.title || ""}
          onUpdate={(colId, cardId, updates) => {
            updateCard(colId, cardId, updates);
            setOpenCard((prev) => prev ? { ...prev, card: { ...prev.card, ...updates } } : null);
          }}
          onClose={() => setOpenCard(null)}
        />
      )}
    </ToolPageContainer>
  );
}
