import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ArrowRight, FileText } from "lucide-react";

interface Form {
  id: string;
  title: string;
  description: string | null;
  status: "active" | "draft";
  order_index: number;
}
const PAGE = 6;

export default function EmployeeForms() {
  const [forms, setForms] = useState<Form[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/forms?status=active').then((data) => setForms(data || []));
  }, []);

  const total = Math.max(1, Math.ceil(forms.length / PAGE));
  const paged = forms.slice((page - 1) * PAGE, page * PAGE);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Form đang mở</h1>
        <p className="mt-1 text-muted-foreground">Chọn một form bên dưới để bắt đầu điền</p>
      </div>

      {forms.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">Hiện chưa có form nào đang hoạt động.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paged.map((f) => (
            <Card key={f.id} className="group relative flex flex-col gap-3 overflow-hidden p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)]">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[image:var(--gradient-primary)] opacity-10 transition group-hover:opacity-20" />
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">{f.description || "Không có mô tả"}</p>
              <Link to={`/forms/${f.id}`} className="mt-auto">
                <Button className="w-full gap-2">Điền form <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </Card>
          ))}
        </div>
      )}

      {forms.length > PAGE && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem><PaginationPrevious onClick={() => setPage(Math.max(1, page - 1))} /></PaginationItem>
            {Array.from({ length: total }).map((_, i) => (
              <PaginationItem key={i}><PaginationLink isActive={page === i + 1} onClick={() => setPage(i + 1)}>{i + 1}</PaginationLink></PaginationItem>
            ))}
            <PaginationItem><PaginationNext onClick={() => setPage(Math.min(total, page + 1))} /></PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </Layout>
  );
}