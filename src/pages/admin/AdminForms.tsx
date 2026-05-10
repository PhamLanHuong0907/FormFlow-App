import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Form {
  id: string;
  title: string;
  description: string | null;
  status: "active" | "draft";
  order_index: number;
}
const PAGE = 6;

export default function AdminForms() {
  const { user } = useAuth();
  const [forms, setForms] = useState<Form[]>([]);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState(0);
  const [status, setStatus] = useState<"active" | "draft">("draft");

  async function load() {
    try {
      const data = await api.get('/forms');
      setForms(data);
    } catch (error: any) {
      toast.error(error.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!title.trim()) return toast.error("Tiêu đề không được trống");
    try {
      await api.post('/forms', { title, description, order_index: order, status });
      toast.success("Đã tạo form");
      setOpen(false); setTitle(""); setDescription(""); setOrder(0); setStatus("draft");
      load();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function remove(id: string) {
    try {
      await api.delete(`/forms/${id}`);
      toast.success("Đã xóa form");
      setDelId(null); load();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  const total = Math.max(1, Math.ceil(forms.length / PAGE));
  const paged = forms.slice((page - 1) * PAGE, page * PAGE);

  return (
    <Layout>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Form</h1>
          <p className="mt-1 text-muted-foreground">Tạo và phân phối form cho nhân viên SW</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Tạo form mới</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tạo form mới</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Tiêu đề</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
              <div className="space-y-2"><Label>Mô tả</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Thứ tự</Label><Input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} /></div>
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <Select value={status} onValueChange={(v: "active" | "draft") => setStatus(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Bản nháp</SelectItem>
                      <SelectItem value="active">Hoạt động</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter><Button onClick={create}>Tạo</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {forms.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">Chưa có form nào. Tạo form đầu tiên để bắt đầu.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paged.map((f) => (
            <Card key={f.id} className="group flex flex-col gap-3 p-5 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-elegant)]">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-tight">{f.title}</h3>
                <Badge variant={f.status === "active" ? "default" : "secondary"}>
                  {f.status === "active" ? "Hoạt động" : "Nháp"}
                </Badge>
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">{f.description || "Không có mô tả"}</p>
              <div className="text-xs text-muted-foreground">Thứ tự: {f.order_index}</div>
              <div className="mt-auto flex flex-col gap-2 pt-2">
                <div className="flex gap-2">
                  <Link to={`/admin/forms/${f.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full gap-1"><Pencil className="h-3.5 w-3.5" /> Chỉnh sửa</Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => setDelId(f.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <Link to={`/admin/forms/${f.id}/results`}>
                  <Button variant="outline" size="sm" className="w-full gap-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5">
                    <Eye className="h-3.5 w-3.5" /> Xem kết quả
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {forms.length > PAGE && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem><PaginationPrevious onClick={() => setPage(Math.max(1, page - 1))} /></PaginationItem>
            {Array.from({ length: total }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink isActive={page === i + 1} onClick={() => setPage(i + 1)}>{i + 1}</PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem><PaginationNext onClick={() => setPage(Math.min(total, page + 1))} /></PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <AlertDialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa form?</AlertDialogTitle>
            <AlertDialogDescription>Hành động này sẽ xóa form và tất cả các trường cũng như submission liên quan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => delId && remove(delId)}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}