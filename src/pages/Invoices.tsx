// @ts-nocheck - Waiting for database migration to generate types
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, TrendingUp, DollarSign, Clock } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import InvoiceCard, { type Invoice } from "@/components/invoices/InvoiceCard";
import EnhancedCreateInvoiceDialog from "@/components/invoices/EnhancedCreateInvoiceDialog";
import PaymentDialog from "@/components/invoices/PaymentDialog";
import TransactionsTable from "@/components/invoices/TransactionsTable";
import { generateInvoicePDF } from "@/components/invoices/InvoicePDF";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    loadInvoices();
  }, []);

  const checkAuth = async () => {
    try {
      if (!apiClient.isAuthenticated()) {
        navigate("/auth");
        return;
      }
      
      const user = await apiClient.getCurrentUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      
      setCurrentUserId(user.id);
    } catch (error) {
      console.error("Auth check failed:", error);
      navigate("/auth");
    }
  };

  const loadInvoices = async () => {
    try {
      if (!apiClient.isAuthenticated()) {
        navigate("/auth");
        return;
      }
      
      const user = await apiClient.getCurrentUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Load payments data as invoices (payments table is used for invoices)
      const paymentsData = await apiClient.getPayments();
      
      // Transform payments to invoice format
      const invoicesData = (paymentsData || []).map((payment: any) => ({
        id: payment.id,
        invoice_number: `INV-${payment.id.substring(0, 8).toUpperCase()}`,
        editor_id: payment.recipient_id,
        client_id: payment.payer_id,
        project_id: payment.project_id,
        total_amount: payment.amount,
        paid_amount: payment.status === 'paid' ? payment.amount : 0,
        remaining_amount: payment.status === 'paid' ? 0 : payment.amount,
        status: payment.status,
        due_date: payment.due_date,
        paid_date: payment.paid_date,
        payment_type: payment.payment_type,
        invoice_url: payment.invoice_url,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
      }));
      
      setInvoices(invoicesData as Invoice[]);
    } catch (error: any) {
      console.error("Error loading invoices:", error);
      if (error.message?.includes('Unauthorized')) {
        navigate("/auth");
      } else {
        toast.error("Failed to load invoices");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!selectedInvoiceId) return;

    try {
      // Delete payment (which acts as invoice)
      await apiClient.deletePayment(selectedInvoiceId);
      toast.success("Invoice deleted successfully");
      setInvoices(invoices.filter((inv) => inv.id !== selectedInvoiceId));
      setDeleteDialogOpen(false);
      setSelectedInvoiceId(null);
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Failed to delete invoice");
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    toast.info("Edit functionality coming soon");
  };

  const handleProcessPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentDialogOpen(true);
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      if (!currentUserId) return;

      // Fetch project for this invoice
      let projects: any[] = [];
      if (invoice.project_id) {
        try {
          const projectData = await apiClient.getProject(invoice.project_id);
          if (projectData) {
            projects = [{
              name: projectData.name,
              fee: projectData.fee || invoice.total_amount
            }];
          }
        } catch (error) {
          console.error("Error loading project:", error);
        }
      }

      // Fetch user profile for editor name
      const profile = await apiClient.getProfile(currentUserId);

      await generateInvoicePDF(
        invoice, 
        projects, 
        profile?.full_name || "Unknown"
      );
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Financial Analytics Calculations
  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paid_amount), 0);
  const totalPending = invoices
    .filter((inv) => inv.status === "pending")
    .reduce((sum, inv) => sum + Number(inv.remaining_amount), 0);
  const totalPartial = invoices
    .filter((inv) => inv.status === "partial")
    .reduce((sum, inv) => sum + Number(inv.remaining_amount), 0);

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
                  <p className="text-sm text-muted-foreground">Manage your invoices and payments</p>
                </div>
              </div>
            </div>
          </header>

          <main className="px-8 py-8">
            {/* Financial Analytics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="shadow-elegant">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Invoiced
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">₹{totalInvoiced.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-elegant">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Paid
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success">₹{totalPaid.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {invoices.filter((inv) => inv.status === "paid").length} completed
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-elegant">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending
                  </CardTitle>
                  <Clock className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-warning">₹{totalPending.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {invoices.filter((inv) => inv.status === "pending").length} awaiting payment
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-elegant">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Partial Payments
                  </CardTitle>
                  <FileText className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">₹{totalPartial.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {invoices.filter((inv) => inv.status === "partial").length} in progress
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Create Invoice Button */}
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">All Invoices</h2>
              <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Invoice
              </Button>
            </div>

            {/* Invoice List */}
            <div className="space-y-4 mb-8">
              {invoices.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  onEdit={handleEditInvoice}
                  onDelete={(id) => {
                    setSelectedInvoiceId(id);
                    setDeleteDialogOpen(true);
                  }}
                  onProcessPayment={handleProcessPayment}
                  onDownloadPDF={handleDownloadPDF}
                />
              ))}
            </div>

            {/* Transactions Table */}
            {invoices.length > 0 && <TransactionsTable />}

            {/* Empty State */}
            {invoices.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first invoice to start tracking your payments
                </p>
                <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Invoice
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Create Invoice Dialog */}
      <EnhancedCreateInvoiceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadInvoices}
      />

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        invoice={selectedInvoice}
        onSuccess={loadInvoices}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the invoice
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvoice}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
