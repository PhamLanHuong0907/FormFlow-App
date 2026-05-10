import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface Row {
  id: string;
  created_at: string;
  answers: Record<string, unknown>;
  form_title: string;
}

export default function History() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!user) return;
    api.get('/submissions').then((data) => setRows(data || []));
  }, [user]);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Lịch sử gửi form</h1>
        <p className="mt-1 text-muted-foreground">Tất cả các form bạn đã gửi</p>
      </div>
      <Card className="overflow-hidden shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Form</TableHead>
              <TableHead>Số câu trả lời</TableHead>
              <TableHead>Thời gian</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="py-10 text-center text-muted-foreground">Chưa có submission nào.</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.form_title ?? "—"}</TableCell>
                <TableCell>{Object.keys(r.answers || {}).length}</TableCell>
                <TableCell>{format(new Date(r.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Layout>
  );
}