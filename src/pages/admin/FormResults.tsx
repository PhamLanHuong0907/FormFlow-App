import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Field {
  id: string;
  label: string;
  type: string;
}

interface Submission {
  id: string;
  user_name: string;
  user_email: string;
  created_at: string;
  answers: Record<string, any>;
}

interface Form {
  id: string;
  title: string;
  fields: Field[];
}

export default function FormResults() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const [formData, subsData] = await Promise.all([
          api.get(`/forms/${id}`),
          api.get(`/submissions/form/${id}`)
        ]);
        setForm(formData);
        setSubmissions(subsData);
      } catch (error: any) {
        toast.error("Không thể tải kết quả: " + error.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const exportToCSV = () => {
    if (!form || !submissions.length) return;
    
    const headers = ["Người nộp", "Email", "Thời gian", ...form.fields.map(f => f.label)];
    const rows = submissions.map(s => [
      s.user_name,
      s.user_email,
      format(new Date(s.created_at), "yyyy-MM-dd HH:mm:ss"),
      ...form.fields.map(f => {
        const val = s.answers[f.id];
        return typeof val === 'object' ? JSON.stringify(val) : val;
      })
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ket_qua_${form.title.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <Layout><div className="flex h-[50vh] items-center justify-center">Đang tải...</div></Layout>;
  if (!form) return <Layout><div className="text-center py-20">Không tìm thấy form.</div></Layout>;

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 gap-2 p-0 hover:bg-transparent" onClick={() => nav("/admin/forms")}>
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Kết quả: {form.title}</h1>
          <p className="text-muted-foreground">Tổng cộng {submissions.length} lượt phản hồi</p>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="gap-2 shadow-sm" disabled={submissions.length === 0}>
          <FileSpreadsheet className="h-4 w-4" /> Xuất Excel (CSV)
        </Button>
      </div>

      <Card className="overflow-hidden shadow-xl border-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[180px]">Người nộp</TableHead>
                <TableHead className="w-[150px]">Thời gian</TableHead>
                {form.fields.map(f => (
                  <TableHead key={f.id} className="min-w-[150px]">{f.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={form.fields.length + 2} className="h-32 text-center text-muted-foreground">
                    Chưa có lượt nộp nào cho form này.
                  </TableCell>
                </TableRow>
              ) : (
                submissions.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="font-medium">{s.user_name}</div>
                      <div className="text-xs text-muted-foreground">{s.user_email}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(s.created_at), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    {form.fields.map(f => {
                      const val = s.answers[f.id];
                      return (
                        <TableCell key={f.id} className="text-sm">
                          {f.type === 'color' ? (
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: String(val) }} />
                              <span>{String(val || "—")}</span>
                            </div>
                          ) : String(val || "—")}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </Layout>
  );
}
