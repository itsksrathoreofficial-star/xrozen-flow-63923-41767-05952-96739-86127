import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Download, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/database-config";
import { format } from "date-fns";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface Payment {
  id: string;
  amount: number;
  status: string;
  payment_type: string;
  due_date: string;
  paid_date: string;
  created_at: string;
  project_id: string;
}

export default function Invoices() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    loadPayments();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const loadPayments = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const data = await db.query({
        collection: "payments",
        operation: "select",
        where: { payer_id: user.id },
        orderBy: { column: "created_at", ascending: false },
      });
      setPayments(data || []);
    } catch (error) {
      console.error("Error loading payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500/10 text-green-500";
      case "pending":
        return "bg-yellow-500/10 text-yellow-500";
      case "overdue":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalRevenue = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const pendingAmount = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <AppSidebar />
        <div className="flex-1 bg-gradient-to-br from-background via-primary/5 to-success/5">
          <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex items-center px-6 py-4 gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow">
                  <FileText className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Invoices</h1>
                  <p className="text-sm text-muted-foreground">Track your payments and invoices</p>
                </div>
              </div>
            </div>
          </header>

          <main className="px-8 py-8">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success">
                    ₹{totalRevenue.toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending Payments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-warning">
                    ₹{pendingAmount.toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Invoices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{payments.length}</div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {payments.map((payment) => (
                <Card key={payment.id} className="shadow-elegant hover:shadow-glow transition-smooth">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                          <FileText className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Invoice #{payment.id.slice(0, 8)}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(payment.created_at), "MMM dd, yyyy")}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-2xl font-bold">
                            <DollarSign className="h-5 w-5" />
                            ₹{Number(payment.amount).toFixed(2)}
                          </div>
                          <Badge className={getStatusColor(payment.status)} variant="secondary">
                            {payment.status}
                          </Badge>
                        </div>
                        <Button variant="outline" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {payments.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No invoices yet</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
