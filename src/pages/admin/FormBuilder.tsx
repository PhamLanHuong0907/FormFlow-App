import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical, ArrowLeft, Save, X, Info, FileText, Hash, Calendar, Palette, List, Check, Upload, Link } from "lucide-react";
import { toast } from "sonner";
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
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { cn } from "@/lib/utils";

interface Form {
  id: string;
  title: string;
  description: string | null;
  status: "active" | "draft";
  order_index: number;
}

interface Field {
  id: string;
  form_id: string;
  label: string;
  type: "text" | "number" | "date" | "color" | "select" | "file" | "url";
  required: boolean;
  order_index: number;
  options?: string[];
}

type FieldType = Field["type"];

const TYPE_LABELS: Record<FieldType, string> = {
  text: "Văn bản",
  number: "Số (0-100)",
  date: "Ngày tháng",
  color: "Màu sắc",
  select: "Lựa chọn",
  file: "Tải lên file",
  url: "Đường dẫn (Link)",
};

const VALIDATION_HELP: Record<FieldType, string> = {
  text: "Tối đa 200 ký tự",
  number: "Giá trị từ 0 đến 100",
  date: "Cho phép chọn ngày bất kỳ",
  color: "Mã màu HEX (#RRGGBB)",
  select: "Chọn 1 trong các phương án",
  file: "Hỗ trợ đính kèm tài liệu",
  url: "Kiểm tra định dạng đường dẫn",
};

export default function FormBuilder() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function load() {
    if (!id) return;
    try {
      const data = await api.get(`/forms/${id}`);
      setForm(data);
      setFields(data.fields || []);
    } catch (error: any) {
      toast.error(error.message);
    }
  }
  useEffect(() => { load(); }, [id]);

  async function saveForm() {
    if (!form) return;
    setSaving(true);
    try {
      await api.put(`/forms/${form.id}`, {
        title: form.title, description: form.description,
        order_index: form.order_index, status: form.status,
      });
      await api.post(`/forms/${form.id}/fields`, { fields });
      toast.success("Đã lưu thông tin form và thứ tự các trường");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function addField(type: FieldType = "text") {
    if (!id) return;
    try {
      const defaultOptions = type === "select" ? ["Lựa chọn 1"] : (type === "url" ? ["any"] : []);
      const data = await api.post('/forms/fields', {
        form_id: id, 
        label: `Câu hỏi mới (${TYPE_LABELS[type]})`, 
        type: type, 
        order_index: fields.length, 
        required: false, 
        options: defaultOptions,
      });
      setFields([...fields, data]);
      toast.success(`Đã thêm trường ${TYPE_LABELS[type]}`);
      
      // Sync state from backend (handles shifts)
      load();

      // Scroll to bottom
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function updateField(fid: string, patch: Partial<Field>) {
    setFields((prev) => {
      const updated = prev.map((f) => (f.id === fid ? { ...f, ...patch } : f));
      // Sort immediately for UI feedback if order changed
      if (patch.order_index !== undefined) {
        return [...updated].sort((a, b) => a.order_index - b.order_index);
      }
      return updated;
    });

    try {
      await api.put(`/forms/fields/${fid}`, patch);
      // If order changed, reload to sync shifted indices from backend
      if (patch.order_index !== undefined) {
        load(); 
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function removeField(fid: string) {
    try {
      await api.delete(`/forms/fields/${fid}`);
      setFields(fields.filter((f) => f.id !== fid));
      toast.success("Đã xóa trường");
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over?.id);
        const newArray = arrayMove(items, oldIndex, newIndex);
        return newArray.map((item, index) => ({ ...item, order_index: index }));
      });
    }
  }

  if (!form) return <Layout><div className="flex h-[50vh] items-center justify-center text-muted-foreground">Đang tải...</div></Layout>;

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => nav("/admin/forms")}>
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load} className="gap-2">Làm mới</Button>
            <Button onClick={saveForm} disabled={saving} className="gap-2 shadow-lg">
              {saving ? "Đang lưu..." : <><Save className="h-4 w-4" /> Lưu tất cả</>}
            </Button>
          </div>
        </div>

        <div className="relative flex flex-col gap-8 md:flex-row">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            <Card className="overflow-hidden border-t-8 border-t-primary p-0 shadow-xl">
              <div className="p-8">
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Input 
                      className="h-auto border-none p-0 text-3xl font-bold shadow-none focus-visible:ring-0" 
                      placeholder="Tiêu đề Form"
                      value={form.title} 
                      onChange={(e) => setForm({ ...form, title: e.target.value })} 
                    />
                    <div className="h-px w-full bg-border" />
                  </div>
                  <div className="space-y-2">
                    <Textarea 
                      className="min-h-[80px] resize-none border-none p-0 text-lg shadow-none focus-visible:ring-0" 
                      placeholder="Mô tả form (tùy chọn)"
                      value={form.description ?? ""} 
                      onChange={(e) => setForm({ ...form, description: e.target.value })} 
                    />
                  </div>
                  <div className="flex flex-wrap gap-4 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">Thứ tự hiển thị:</Label>
                      <Input 
                        type="number" 
                        className="w-20"
                        value={form.order_index} 
                        onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) })} 
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">Trạng thái:</Label>
                      <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Form["status"] })}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Bản nháp</SelectItem>
                          <SelectItem value="active">Hoạt động</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter} 
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-6 pb-24">
                  {fields.map((f, idx) => (
                    <SortableFieldRow 
                      key={f.id} 
                      field={f} 
                      index={idx} 
                      onUpdate={(p) => updateField(f.id, p)} 
                      onRemove={() => removeField(f.id)} 
                    />
                  ))}
                  {fields.length === 0 && (
                    <div className="rounded-xl border-2 border-dashed p-16 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <Plus className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium">Chưa có câu hỏi</h3>
                      <p className="text-muted-foreground">Sử dụng thanh công cụ bên cạnh để thêm câu hỏi đầu tiên.</p>
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Sidebar Toolbox */}
          <div className="sticky top-24 h-fit md:w-64">
            <Card className="p-4 shadow-lg border-primary/20 bg-background/95 backdrop-blur">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Thanh công cụ</h3>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <Button 
                    key={key}
                    variant="outline" 
                    className="justify-start gap-3 h-11 hover:bg-primary/5 hover:border-primary/50 transition-all"
                    onClick={() => addField(key as FieldType)}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                      {key === 'text' && <FileText className="h-4 w-4" />}
                      {key === 'number' && <Hash className="h-4 w-4" />}
                      {key === 'date' && <Calendar className="h-4 w-4" />}
                      {key === 'color' && <Palette className="h-4 w-4" />}
                      {key === 'select' && <List className="h-4 w-4" />}
                      {key === 'file' && <Upload className="h-4 w-4" />}
                      {key === 'url' && <Link className="h-4 w-4" />}
                    </div>
                    <span>{label}</span>
                  </Button>
                ))}
              </div>
              <div className="mt-6 border-t pt-4">
                <p className="text-[10px] text-muted-foreground text-center">
                  Bấm để thêm câu hỏi mới vào form
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function SortableFieldRow({ field, index, onUpdate, onRemove }: { field: Field; index: number; onUpdate: (p: Partial<Field>) => void; onRemove: () => void }) {
  const [localOrder, setLocalOrder] = useState(field.order_index);
  
  useEffect(() => {
    setLocalOrder(field.order_index);
  }, [field.order_index]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
  };

  const opts = field.options || [];
  const hasOrderChanged = localOrder !== field.order_index;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md",
        isDragging && "opacity-50 shadow-2xl"
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
          <GripVertical className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium">
            <Switch 
              id={`req-${field.id}`} 
              checked={field.required} 
              onCheckedChange={(c) => onUpdate({ required: c })} 
              className="h-4 w-8"
            />
            <Label htmlFor={`req-${field.id}`} className="cursor-pointer">Bắt buộc</Label>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">STT (Thứ tự)</Label>
          <div className="flex gap-2">
            <Input 
              type="number"
              className="h-11"
              value={localOrder} 
              onChange={(e) => setLocalOrder(Number(e.target.value))}
            />
            {hasOrderChanged && (
              <Button 
                size="icon" 
                className="h-11 w-11 shrink-0 bg-green-600 hover:bg-green-700 shadow-sm"
                onClick={() => onUpdate({ order_index: localOrder })}
              >
                <Check className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nội dung câu hỏi</Label>
          <Input 
            className="h-11 text-lg font-medium" 
            placeholder="Nhập nội dung câu hỏi..."
            value={field.label} 
            onChange={(e) => onUpdate({ label: e.target.value })} 
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Loại câu trả lời</Label>
          <Select value={field.type} onValueChange={(v) => onUpdate({ type: v as FieldType, options: v === "select" ? (opts.length ? opts : ["Lựa chọn 1"]) : [] })}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Info className="h-3 w-3" />
            <span>Ràng buộc: {VALIDATION_HELP[field.type]}</span>
          </div>
        </div>
      </div>

      {field.type === "select" && (
        <div className="mt-6 space-y-3 rounded-lg bg-muted/40 p-4">
          <Label className="text-xs font-bold uppercase tracking-wider">Danh sách lựa chọn</Label>
          <div className="space-y-2">
            {opts.map((o, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex h-10 w-8 items-center justify-center text-xs font-bold text-muted-foreground">{i + 1}.</div>
                <Input 
                  className="bg-background"
                  value={o} 
                  onChange={(e) => {
                    const next = [...opts]; next[i] = e.target.value; onUpdate({ options: next });
                  }} 
                />
                <Button variant="ghost" size="icon" onClick={() => {
                  const next = opts.filter((_, j) => j !== i); onUpdate({ options: next });
                }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-2 h-9 w-full border-dashed bg-background" onClick={() => onUpdate({ options: [...opts, `Lựa chọn ${opts.length + 1}`] })}>
            <Plus className="mr-2 h-4 w-4" /> Thêm lựa chọn khác
          </Button>
        </div>
      )}

      {field.type === "url" && (
        <div className="mt-6 space-y-3 rounded-lg bg-muted/40 p-4">
          <Label className="text-xs font-bold uppercase tracking-wider">Định dạng Link yêu cầu</Label>
          <Select 
            value={opts[0] || "any"} 
            onValueChange={(v) => onUpdate({ options: [v] })}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Chọn loại link..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Bất kỳ URL nào</SelectItem>
              <SelectItem value="github">Github</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="drive">Google Drive</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground">
            Hệ thống sẽ tự động kiểm tra định dạng link người dùng nhập vào.
          </p>
        </div>
      )}

      {field.type === "file" && (
        <div className="mt-6 rounded-lg bg-muted/40 p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Info className="h-4 w-4" />
            <p className="text-xs">
              Trường này cho phép người dùng đính kèm tài liệu. (Giới hạn 10MB)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}