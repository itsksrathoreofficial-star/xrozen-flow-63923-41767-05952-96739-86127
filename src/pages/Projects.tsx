import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Plus, Clock, CheckCircle2, Edit, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { db } from "@/lib/database-config";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [editors, setEditors] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [newProject, setNewProject] = useState({ 
    name: "", 
    description: "",
    editor_id: "",
    client_id: "",
    fee: ""
  });

  useEffect(() => {
    loadProjects();
    loadEditors();
    loadClients();
  }, []);

  const loadProjects = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const projectsData = await db.query({
        collection: 'projects',
        operation: 'select',
        where: { creator_id: session.user.id },
        orderBy: { column: 'created_at', ascending: false }
      }) as any[];

      setProjects(projectsData || []);
    } catch (error: any) {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const loadEditors = async () => {
    try {
      const editorsData = await db.query({
        collection: 'editors',
        operation: 'select',
        orderBy: { column: 'created_at', ascending: false }
      }) as any[];
      setEditors(editorsData || []);
    } catch (error) {
      console.error("Error loading editors:", error);
    }
  };

  const loadClients = async () => {
    try {
      const clientsData = await db.query({
        collection: 'clients',
        operation: 'select',
        orderBy: { column: 'created_at', ascending: false }
      }) as any[];
      setClients(clientsData || []);
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const selectedEditor = editors.find(e => e.id === newProject.editor_id);
      const isFreelance = selectedEditor?.employment_type === 'freelance';

      if (editingProject) {
        // Update existing project
        await db.query({
          collection: 'projects',
          operation: 'update',
          where: { id: editingProject.id },
          data: {
            name: newProject.name,
            description: newProject.description,
            editor_id: newProject.editor_id || null,
            client_id: newProject.client_id || null,
            fee: (isFreelance && newProject.fee) ? parseFloat(newProject.fee) : null,
          }
        });
        toast.success("Project updated successfully!");
      } else {
        // Create new project
        await db.query({
          collection: 'projects',
          operation: 'insert',
          data: {
            name: newProject.name,
            description: newProject.description,
            editor_id: newProject.editor_id || null,
            client_id: newProject.client_id || null,
            creator_id: session.user.id,
            fee: (isFreelance && newProject.fee) ? parseFloat(newProject.fee) : null,
            status: 'draft'
          }
        });
        toast.success("Project created successfully!");
      }

      setDialogOpen(false);
      setEditingProject(null);
      setNewProject({ name: "", description: "", editor_id: "", client_id: "", fee: "" });
      loadProjects();
    } catch (error: any) {
      toast.error("Failed to save project");
    }
  };

  const handleEdit = (project: any) => {
    setEditingProject(project);
    setNewProject({
      name: project.name,
      description: project.description || "",
      editor_id: project.editor_id || "",
      client_id: project.client_id || "",
      fee: project.fee?.toString() || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (projectId: string) => {
    try {
      await db.query({
        collection: 'projects',
        operation: 'delete',
        where: { id: projectId },
      });

      setProjects(projects.filter(p => p.id !== projectId));
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingProject(null);
      setNewProject({ name: "", description: "", editor_id: "", client_id: "", fee: "" });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: { variant: "secondary", label: "Draft" },
      in_review: { variant: "default", label: "In Review" },
      approved: { variant: "default", label: "Approved", className: "bg-success" },
      completed: { variant: "default", label: "Completed", className: "bg-success" }
    };
    
    const config = variants[status] || variants.draft;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
                  <Video className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold">Projects</h1>
              </div>
          <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingProject ? "Edit Project" : "Create New Project"}</DialogTitle>
                <DialogDescription>
                  {editingProject ? "Update project details" : "Add a new video editing project to your workflow"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    placeholder="Summer Campaign 2025"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the project..."
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editor">Editor (Optional)</Label>
                  <Select
                    value={newProject.editor_id}
                    onValueChange={(value) => setNewProject({ ...newProject, editor_id: value, fee: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an editor" />
                    </SelectTrigger>
                    <SelectContent>
                      {editors.map((editor) => (
                        <SelectItem key={editor.id} value={editor.id}>
                          {editor.full_name} - {editor.employment_type === 'freelance' ? 'Freelance' : 'Full Time'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client">Client (Optional)</Label>
                  <Select
                    value={newProject.client_id}
                    onValueChange={(value) => setNewProject({ ...newProject, client_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.full_name} {client.company ? `(${client.company})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {newProject.editor_id && editors.find(e => e.id === newProject.editor_id)?.employment_type === 'freelance' && (
                  <div className="space-y-2">
                    <Label htmlFor="fee">Project Fee (₹)</Label>
                    <Input
                      id="fee"
                      type="number"
                      step="0.01"
                      placeholder="Enter project fee"
                      value={newProject.fee}
                      onChange={(e) => setNewProject({ ...newProject, fee: e.target.value })}
                    />
                  </div>
                )}

                <Button type="submit" className="w-full gradient-primary">
                  {editingProject ? "Update Project" : "Create Project"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
            </div>
          </header>

          <main className="px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Your Projects</h2>
          <p className="text-muted-foreground">
            Manage your video editing projects and track progress
          </p>
        </div>

        {projects.length === 0 ? (
          <Card className="shadow-elegant">
            <CardContent className="py-16 text-center">
              <Video className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first project to get started with video editing workflow
              </p>
              <Button className="gradient-primary" onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className="shadow-elegant hover:shadow-glow transition-smooth group"
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                    {getStatusBadge(project.status)}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {project.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground mb-4">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2 mb-4">
                    {project.status === 'completed' ? (
                      <Badge variant="default" className="bg-success">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="outline">In Progress</Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(project);
                      }}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-destructive hover:text-destructive"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{project.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(project.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Projects;
