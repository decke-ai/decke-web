"use client";

import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import {
  GripVertical,
  User,
  ExternalLink,
  Globe,
  Building2,
  ChevronRight,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Person } from "@/lib/explorium/types";
import { cn } from "@/lib/utils";

const getPersonId = (person: Person): string => {
  return person.prospect_id || person.id || `${person.first_name}-${person.last_name}`;
};

const getPersonFullName = (person: Person): string => {
  if (person.full_name) return person.full_name;
  const parts = [person.first_name, person.last_name].filter(Boolean);
  return parts.join(" ") || "Unknown";
};

const LOWERCASE_WORDS = new Set([
  "and", "or", "the", "a", "an", "of", "in", "on", "at", "to", "for", "with", "by",
  "e", "ou", "de", "da", "do", "das", "dos", "em", "no", "na", "nos", "nas", "para", "com", "por",
  "y", "o", "el", "la", "los", "las", "en", "con",
]);

const smartCapitalize = (text: string | undefined | null): string => {
  if (!text) return "-";

  return text
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      if (LOWERCASE_WORDS.has(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
};

const MAX_VISIBLE_BADGES = 2;

const BadgeList = ({ items }: { items: string[] }) => {
  if (!items || items.length === 0) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  const visibleItems = items.slice(0, MAX_VISIBLE_BADGES);
  const hiddenItems = items.slice(MAX_VISIBLE_BADGES);
  const hasMore = hiddenItems.length > 0;

  return (
    <div className="flex gap-1 items-center flex-nowrap">
      {visibleItems.map((item, index) => (
        <Badge key={index} variant="secondary" className="text-[10px] whitespace-nowrap uppercase">
          {item}
        </Badge>
      ))}
      {hasMore && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="text-[10px] cursor-pointer bg-foreground text-background hover:bg-foreground/90">
              +{hiddenItems.length}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="flex flex-wrap gap-1">
              {items.map((item, index) => (
                <span key={index} className="text-xs uppercase">
                  {item}
                  {index < items.length - 1 && ","}
                </span>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

type ColumnId =
  | "select"
  | "name"
  | "job_title"
  | "company"
  | "company_domain"
  | "company_linkedin"
  | "location"
  | "linkedin"
  | "experiences"
  | "skills"
  | "interests";

const formatLocation = (person: Person): string => {
  const city = person.city;
  const region = person.region;
  const country = person.country_name || person.country;

  if (city && region && country) {
    return `${smartCapitalize(city)}, ${smartCapitalize(region)} - ${smartCapitalize(country)}`;
  }

  if (region && country) {
    return `${smartCapitalize(region)} - ${smartCapitalize(country)}`;
  }

  if (city && country) {
    return `${smartCapitalize(city)} - ${smartCapitalize(country)}`;
  }

  if (city && region) {
    return `${smartCapitalize(city)}, ${smartCapitalize(region)}`;
  }

  if (city) return smartCapitalize(city);
  if (region) return smartCapitalize(region);
  if (country) return smartCapitalize(country);

  return "-";
};

interface Column {
  id: ColumnId;
  label: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sticky?: boolean;
  stickyOffset?: number;
}

interface PeopleTableProps {
  people: Person[];
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
  hiddenColumns?: ColumnId[];
  onPersonClick?: (person: Person) => void;
}

function SortableHeader({
  column,
  children,
  onAutoResize,
  isResizing,
  onResizeStart,
}: {
  column: Column;
  children: React.ReactNode;
  onAutoResize?: (columnId: ColumnId) => void;
  isResizing?: boolean;
  onResizeStart?: (columnId: ColumnId, startX: number, startWidth: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onResizeStart?.(column.id, e.clientX, column.width || 100);
    },
    [column.id, column.width, onResizeStart]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onAutoResize?.(column.id);
    },
    [column.id, onAutoResize]
  );

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isResizing ? "none" : transition,
    opacity: isDragging ? 0.5 : 1,
    width: column.width,
    minWidth: column.minWidth,
    maxWidth: column.maxWidth,
    position: "sticky" as const,
    top: 0,
    zIndex: column.sticky ? 30 : 20,
    ...(column.sticky && {
      left: column.stickyOffset ?? 0,
    }),
  };

  const isNonDraggable = column.id === "select" || column.id === "name";
  const isLastStickyColumn = column.id === "name";
  const canResize = column.id !== "select";
  const showSeparator = column.id !== "select";

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        "text-sm font-medium text-muted-foreground whitespace-nowrap relative bg-background border-b",
        isDragging && "bg-muted z-50",
        isLastStickyColumn && "after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border",
        showSeparator && !isLastStickyColumn && "after:absolute after:right-0 after:top-2 after:bottom-2 after:w-px after:bg-border"
      )}
    >
      <div className="flex items-center gap-1 pr-2">
        {!isNonDraggable && (
          <span
            {...attributes}
            {...listeners}
            className="cursor-grab hover:text-foreground text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="h-3 w-3" />
          </span>
        )}
        {children}
      </div>
      {canResize && (
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          className={cn(
            "absolute right-0 top-0 h-full w-2 cursor-col-resize z-30",
            "hover:bg-primary/20",
            isResizing && "bg-primary/30"
          )}
        />
      )}
    </TableHead>
  );
}

export function PeopleTable({
  people,
  selectedIds,
  onSelectChange,
  hiddenColumns = [],
  onPersonClick,
}: PeopleTableProps) {

  const [resizingColumnId, setResizingColumnId] = useState<ColumnId | null>(null);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(0);

  const defaultColumns: Column[] = useMemo(
    () => [
      { id: "select", label: "", width: 40, minWidth: 40, maxWidth: 40, sticky: true, stickyOffset: 0 },
      { id: "name", label: "Person Name", width: 200, minWidth: 150, maxWidth: 400, sticky: true, stickyOffset: 40 },
      { id: "job_title", label: "Person Job Title", width: 180, minWidth: 120, maxWidth: 300 },
      { id: "company", label: "Company Name", width: 180, minWidth: 120, maxWidth: 300 },
      { id: "company_domain", label: "Company Domain", width: 150, minWidth: 100, maxWidth: 250 },
      { id: "company_linkedin", label: "Company LinkedIn", width: 150, minWidth: 100, maxWidth: 250 },
      { id: "location", label: "Person Location", width: 200, minWidth: 120, maxWidth: 350 },
      { id: "linkedin", label: "Person LinkedIn", width: 150, minWidth: 100, maxWidth: 250 },
      { id: "experiences", label: "Person Experiences", width: 250, minWidth: 200, maxWidth: 400 },
      { id: "skills", label: "Person Skills", width: 250, minWidth: 200, maxWidth: 400 },
      { id: "interests", label: "Person Interests", width: 250, minWidth: 200, maxWidth: 400 },
    ],
    []
  );

  const [columns, setColumns] = useState<Column[]>(defaultColumns);

  const visibleColumns = useMemo(
    () => columns.filter((col) => col.id === "select" || !hiddenColumns.includes(col.id)),
    [columns, hiddenColumns]
  );

  useEffect(() => {
    setColumns((prev) =>
      prev.map((col) => {
        const defaultCol = defaultColumns.find((d) => d.id === col.id);
        return defaultCol ? { ...col, label: defaultCol.label } : col;
      })
    );
  }, [defaultColumns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);

        const activeItem = items[oldIndex];
        const overItem = items[newIndex];
        const fixedColumns = ["select", "name", "actions"];
        if (
          fixedColumns.includes(activeItem.id) ||
          fixedColumns.includes(overItem.id)
        ) {
          return items;
        }

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleColumnResize = useCallback((columnId: ColumnId, width: number) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === columnId ? { ...col, width } : col))
    );
  }, []);

  const handleResizeStart = useCallback(
    (columnId: ColumnId, startX: number, startWidth: number) => {
      setResizingColumnId(columnId);
      resizeStartXRef.current = startX;
      resizeStartWidthRef.current = startWidth;
    },
    []
  );

  useEffect(() => {
    if (!resizingColumnId) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const column = columns.find((c) => c.id === resizingColumnId);
      if (!column) return;

      const diff = e.clientX - resizeStartXRef.current;
      const newWidth = Math.max(
        column.minWidth || 50,
        Math.min(column.maxWidth || 500, resizeStartWidthRef.current + diff)
      );
      handleColumnResize(resizingColumnId, newWidth);
    };

    const handleMouseUp = () => {
      setResizingColumnId(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizingColumnId, columns, handleColumnResize]);

  const handleAutoResize = useCallback(
    (columnId: ColumnId) => {
      const measureText = (text: string, fontWeight: string = "normal"): number => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) return 0;
        context.font = `${fontWeight} 14px ui-sans-serif, system-ui, sans-serif`;
        return context.measureText(text).width;
      };

      let maxWidth = 0;
      const padding = 32;

      const column = columns.find((c) => c.id === columnId);
      if (column?.label) {
        maxWidth = Math.max(maxWidth, measureText(column.label, "500") + padding + 24);
      }

      people.forEach((person) => {
        let text = "";
        switch (columnId) {
          case "name":
            text = getPersonFullName(person);
            maxWidth = Math.max(maxWidth, measureText(text, "500") + padding + 44);
            break;
          case "job_title":
            text = person.job_title || "";
            break;
          case "company":
            text = person.company_name || "";
            break;
          case "company_domain":
            text = person.company_domain || "";
            break;
          case "company_linkedin":
            text = (person.company_linkedin_url || "")
              .replace(/^https?:\/\//, "")
              .replace(/^www\./, "");
            break;
          case "location":
            text = formatLocation(person);
            break;
          case "linkedin":
            text = (person.linkedin_url || person.linkedin_profile || person.linkedin || "")
              .replace(/^https?:\/\//, "")
              .replace(/^www\./, "");
            break;
          default:
            break;
        }
        if (text && columnId !== "name") {
          maxWidth = Math.max(maxWidth, measureText(text) + padding);
        }
      });

      const finalWidth = Math.max(
        column?.minWidth || 50,
        Math.min(column?.maxWidth || 500, maxWidth)
      );

      setColumns((prev) =>
        prev.map((col) => (col.id === columnId ? { ...col, width: finalWidth } : col))
      );
    },
    [people, columns]
  );

  const allSelected =
    people.length > 0 &&
    people.every((p) => selectedIds.includes(getPersonId(p)));

  const someSelected =
    selectedIds.length > 0 &&
    !allSelected &&
    people.some((p) => selectedIds.includes(getPersonId(p)));

  const handleSelectAll = () => {
    const currentPageIds = people.map((p) => getPersonId(p));
    if (allSelected) {
      // Remove only current page IDs, keep others
      onSelectChange(selectedIds.filter((id) => !currentPageIds.includes(id)));
    } else {
      // Add current page IDs without removing others
      const newIds = currentPageIds.filter((id) => !selectedIds.includes(id));
      onSelectChange([...selectedIds, ...newIds]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  };

  const renderCellContent = (columnId: ColumnId, person: Person) => {
    switch (columnId) {
      case "select":
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={selectedIds.includes(getPersonId(person))}
              onCheckedChange={() => handleSelectOne(getPersonId(person))}
              className="cursor-pointer"
            />
          </div>
        );
      case "name":
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 rounded-lg flex-shrink-0">
              {person.profile_picture ? (
                <AvatarImage
                  src={person.profile_picture}
                  alt={getPersonFullName(person)}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="rounded-lg bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm truncate">{getPersonFullName(person)}</span>
          </div>
        );
      case "job_title":
        return <span className="text-sm truncate">{smartCapitalize(person.job_title)}</span>;
      case "company": {
        const companyName = person.company_name || "-";
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 rounded-lg flex-shrink-0">
              {person.company_logo ? (
                <AvatarImage
                  src={person.company_logo}
                  alt={companyName}
                  className="object-contain"
                />
              ) : null}
              <AvatarFallback className="rounded-lg bg-muted">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm truncate" title={companyName}>
              {companyName}
            </span>
          </div>
        );
      }
      case "company_domain":
        return person.company_domain ? (
          <a
            href={`https://${person.company_domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-primary hover:underline cursor-pointer"
          >
            <Globe className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{person.company_domain}</span>
          </a>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      case "company_linkedin": {
        const companyLinkedinUrl = person.company_linkedin_url;
        const displayCompanyUrl = companyLinkedinUrl
          ?.replace(/^https?:\/\//, "")
          .replace(/^www\./, "");
        return companyLinkedinUrl ? (
          <a
            href={companyLinkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm hover:underline cursor-pointer"
          >
            <span className="truncate">{displayCompanyUrl}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
        ) : (
          <span className="text-sm">-</span>
        );
      }
      case "location": {
        const location = formatLocation(person);
        return (
          <span className="text-sm truncate" title={location}>
            {location}
          </span>
        );
      }
      case "linkedin": {
        const linkedinUrl = person.linkedin_url || person.linkedin_profile || person.linkedin;
        const displayUrl = linkedinUrl
          ?.replace(/^https?:\/\//, "")
          .replace(/^www\./, "");
        return linkedinUrl ? (
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm hover:underline cursor-pointer"
          >
            <span className="truncate">{displayUrl}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
        ) : (
          <span className="text-sm">-</span>
        );
      }
      case "experiences": {
        const experiences = person.experiences || person.experience || person.past_experiences || person.work_experience || [];
        return <BadgeList items={experiences} />;
      }
      case "skills": {
        const skills = person.skills || person.skill || [];
        return <BadgeList items={skills} />;
      }
      case "interests": {
        const interests = person.interests || person.interest || person.topics_of_interest || person.personal_interests || [];
        return <BadgeList items={interests} />;
      }
      default:
        return null;
    }
  };

  const renderHeaderContent = (column: Column) => {
    if (column.id === "select") {
      return (
        <Checkbox
          checked={allSelected}
          ref={(el) => {
            if (el) {
              (el as HTMLButtonElement).dataset.state = someSelected
                ? "indeterminate"
                : allSelected
                ? "checked"
                : "unchecked";
            }
          }}
          onCheckedChange={handleSelectAll}
          className="cursor-pointer"
        />
      );
    }
    // Format label with chevron for prefix (e.g., "Person Name" -> "Person > Name")
    const label = column.label;
    const prefixMatch = label.match(/^(Person|Company)\s+(.+)$/i);
    if (prefixMatch) {
      return (
        <span className="flex items-center gap-1">
          {prefixMatch[1]}
          <ChevronRight className="h-3 w-3" />
          {prefixMatch[2]}
        </span>
      );
    }
    return <span>{label}</span>;
  };

  if (people.length === 0) {
    return null;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full w-full">
        <Table className="w-max min-w-full">
          <TableHeader>
            <TableRow className="group hover:bg-transparent">
              <SortableContext
                items={visibleColumns.map((c) => c.id)}
                strategy={horizontalListSortingStrategy}
              >
                {visibleColumns.map((column) => (
                  <SortableHeader
                    key={column.id}
                    column={column}
                    onAutoResize={handleAutoResize}
                    isResizing={resizingColumnId === column.id}
                    onResizeStart={handleResizeStart}
                  >
                    {renderHeaderContent(column)}
                  </SortableHeader>
                ))}
              </SortableContext>
            </TableRow>
          </TableHeader>
          <TableBody>
            {people.map((person) => (
              <TableRow
                key={getPersonId(person)}
                className="group hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onPersonClick?.(person)}
              >
                {visibleColumns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(
                      "py-3 pr-6 overflow-hidden relative transition-colors",
                      column.sticky && "sticky bg-background group-hover:bg-muted",
                      column.id === "name" && "after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border"
                    )}
                    style={{
                      width: column.width,
                      minWidth: column.minWidth,
                      maxWidth: column.maxWidth,
                      ...(column.sticky && {
                        left: column.stickyOffset ?? 0,
                        zIndex: 10,
                      }),
                    }}
                  >
                    {renderCellContent(column.id, person)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {people.length > 0 && (
              <TableRow className="border-b hover:bg-transparent">
                <TableCell colSpan={visibleColumns.length} className="h-0 p-0" />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </DndContext>
  );
}
