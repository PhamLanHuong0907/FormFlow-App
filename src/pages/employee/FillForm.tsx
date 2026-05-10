import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { validateForm } from "@/lib/validator";
import { useAuth } from "@/hooks/useAuth";

interface Form {
  id: string;
  title: string;
  description: string | null;
}

interface Field {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "color" | "select" | "file" | "url";
  required: boolean;
  options?: string[];
}

const getHelperText = (type: Field["type"]) => {
  switch (type) {
    case "text": return "Tối đa 200 ký tự";
    case "number": return "Giá trị từ 0 đến 100";
    case "date": return "Không chọn ngày trong quá khứ";
    case "color": return "Định dạng #RRGGBB";
    case "select": return "Chọn 1 trong các phương án";
    default: return "";
  }
};

export default function FillForm() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/forms/${id}`).then((data) => {
      setForm(data);
      setFields(data.fields || []);
    });
  }, [id]);

  function setVal(fid: string, v: unknown) {
    setAnswers((a) => ({ ...a, [fid]: v }));
    setErrors((e) => ({ ...e, [fid]: "" }));
  }

  async function submit() {
    const errs = validateForm(fields as any, answers);
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      toast.error("Vui lòng kiểm tra lại các trường đã nhập");
      return;
    }
    if (!form || !user) return;
    setBusy(true);
    try {
      await api.post('/submissions', { form_id: form.id, answers });
      toast.success("Đã gửi form thành công!");
      nav("/forms");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (!form) return <Layout><div className="text-muted-foreground">Đang tải...</div></Layout>;

  return (
    <Layout>
      <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => nav("/forms")}>
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </Button>
      <Card className="mx-auto max-w-2xl p-8 shadow-[var(--shadow-elegant)]">
        <h1 className="text-2xl font-bold tracking-tight">{form.title}</h1>
        {form.description && <p className="mt-2 text-muted-foreground">{form.description}</p>}

        <div className="mt-8 space-y-6">
          {fields.map((f) => (
            <div key={f.id} className="space-y-2">
              <Label className="text-base font-semibold">{f.label}{f.required && <span className="ml-1 text-destructive">*</span>}</Label>
              <FieldInput field={f} value={answers[f.id]} onChange={(v) => setVal(f.id, v)} />
              <div className="flex items-center justify-between gap-2">
                {errors[f.id] ? (
                  <p className="text-sm font-medium text-destructive">{errors[f.id]}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">{getHelperText(f.type)}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <Button onClick={submit} disabled={busy} className="mt-8 w-full" size="lg">
          {busy ? "Đang gửi..." : "Gửi form"}
        </Button>
      </Card>
    </Layout>
  );
}

function FieldInput({ field, value, onChange }: { field: Field; value: unknown; onChange: (v: unknown) => void }) {
  switch (field.type) {
    case "text":
      return <Textarea maxLength={200} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="Tối đa 200 ký tự" />;
    case "number":
      return <Input type="number" min={0} max={100} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "date":
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(new Date(value as string), "PPP") : "Chọn ngày"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={value ? new Date(value as string) : undefined}
              onSelect={(d) => onChange(d ? d.toISOString() : "")}
              disabled={(d) => { const t = new Date(); t.setHours(0, 0, 0, 0); return d < t; }}
              initialFocus className="pointer-events-auto p-3" />
          </PopoverContent>
        </Popover>
      );
    case "color":
      return (
        <div className="flex gap-2">
          <Input type="color" value={(value as string) || "#000000"} onChange={(e) => onChange(e.target.value)} className="h-10 w-16 p-1" />
          <Input value={(value as string) ?? ""} placeholder="#RRGGBB" onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case "select": {
      const opts = ((field.options as unknown as string[]) || []);
      return (
        <Select value={(value as string) ?? ""} onValueChange={onChange}>
          <SelectTrigger><SelectValue placeholder="Chọn..." /></SelectTrigger>
          <SelectContent>
            {opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    }
    case "file":
      return (
        <div className="space-y-2">
          <Input 
            type="file" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onChange(file.name);
            }} 
            className="cursor-pointer"
          />
          <p className="text-[10px] text-muted-foreground">Tối đa 10MB. Các định dạng hỗ trợ: PDF, DOCX, PNG, JPG.</p>
        </div>
      );
    case "url": {
      const platform = (field.options as any)?.[0] || 'any';
      const placeholders: Record<string, string> = {
        github: "https://github.com/username",
        facebook: "https://facebook.com/profile",
        linkedin: "https://linkedin.com/in/username",
        drive: "https://drive.google.com/...",
        any: "https://example.com"
      };
      return <Input value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholders[platform]} />;
    }
  }
}