import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import documentService, { type DocumentData } from "@/services/documentService"
import { vehicleService } from "@/services/vehicleService"
import { driverService } from "@/services/driverService"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { toast } from "sonner"
import {
  FileText,
  Upload,
  Trash2,
  Download,
  AlertTriangle,
  Search,
  Eye,
  Plus,
  X,
  FileCheck,
  Building,
  User,
  ShieldAlert
} from "lucide-react"

export default function DocumentCenter() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Filters
  const [entityTypeFilter, setEntityTypeFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Add Document Modal state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [name, setName] = useState("")
  const [docType, setDocType] = useState<DocumentData["type"]>("Registration Certificate")
  const [targetEntityType, setTargetEntityType] = useState<"Vehicle" | "Driver">("Vehicle")
  const [targetEntityId, setTargetEntityId] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState<{
    fileName: string
    fileSize: number
    fileUrl: string
  } | null>(null)

  // Document view preview modal state
  const [previewDoc, setPreviewDoc] = useState<DocumentData | null>(null)

  // React Queries: Load records
  const { data: docsData, isLoading: isDocsLoading, refetch } = useQuery({
    queryKey: ["documents"],
    queryFn: () => documentService.getDocuments().then(res => res.data),
  })

  // Load Vehicles for dropdown
  const { data: vehiclesData } = useQuery({
    queryKey: ["allVehiclesForDocs"],
    queryFn: () => vehicleService.getVehicles({ limit: 100 }).then(res => res.data.vehicles),
  })

  // Load Drivers for dropdown
  const { data: driversData } = useQuery({
    queryKey: ["allDriversForDocs"],
    queryFn: () => driverService.getDrivers({ limit: 100 }).then(res => res.data.drivers),
  })

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: (data: DocumentData) => documentService.uploadDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] })
      toast.success("Document uploaded successfully")
      setIsAddOpen(false)
      resetForm()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to upload document")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentService.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] })
      toast.success("Document deleted successfully")
    },
    onError: () => {
      toast.error("Failed to delete document")
    },
  })

  const resetForm = () => {
    setName("")
    setDocType("Registration Certificate")
    setTargetEntityType("Vehicle")
    setTargetEntityId("")
    setExpiryDate("")
    setUploadedFile(null)
  }

  // Handle File read to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 4 * 1024 * 1024) {
      toast.error("File size exceeds 4MB limit")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setUploadedFile({
        fileName: file.name,
        fileSize: file.size,
        fileUrl: reader.result as string,
      })
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !targetEntityId || !uploadedFile) {
      toast.error("Please fill in all fields and select a file")
      return
    }

    uploadMutation.mutate({
      name,
      type: docType,
      entityId: targetEntityId,
      entityType: targetEntityType,
      expiryDate: expiryDate || undefined,
      fileName: uploadedFile.fileName,
      fileSize: uploadedFile.fileSize,
      fileUrl: uploadedFile.fileUrl,
    })
  }

  // Helper to process document expiry status
  const getExpiryStatus = (dateStr?: string) => {
    if (!dateStr) return { label: "No Expiry", color: "bg-slate-100 text-slate-800 dark:bg-slate-800/20 dark:text-slate-400 border border-slate-300" }
    
    const expiry = new Date(dateStr)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { label: "Expired", color: "bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400 border border-red-300 animate-pulse" }
    } else if (diffDays <= 30) {
      return { label: `Expiring in ${diffDays} days`, color: "bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-300" }
    }
    return { label: `Expires ${expiry.toLocaleDateString()}`, color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-300" }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const docsList = docsData?.data || []

  // Filter list
  const filteredDocs = (docsList || []).filter((doc: any) => {
    const matchesEntityType = !entityTypeFilter || doc.entityType === entityTypeFilter
    const matchesType = !typeFilter || doc.type === typeFilter
    const matchesSearch = !searchQuery || doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesEntityType && matchesType && matchesSearch
  })

  // Total expired alerts list
  const expiredDocsCount = (docsList || []).filter((d: any) => {
    if (!d.expiryDate) return false
    return new Date(d.expiryDate).getTime() < new Date().getTime()
  }).length

  const expiringSoonCount = (docsList || []).filter((d: any) => {
    if (!d.expiryDate) return false
    const diff = new Date(d.expiryDate).getTime() - new Date().getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days >= 0 && days <= 30
  }).length

  return (
    <div className="space-y-6 text-left">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground/90">Document Center</h1>
          <p className="text-muted-foreground mt-1">
            Store, monitor, and audit validation certificates for vehicles and driver profiles.
          </p>
        </div>
        {(user?.role === "Fleet Manager" || user?.role === "Safety Officer") && (
          <Button onClick={() => setIsAddOpen(true)} className="flex items-center gap-1.5 font-semibold">
            <Plus className="h-4 w-4" /> Upload Certificate
          </Button>
        )}
      </div>

      {/* COMPLIANCE OVERVIEW SUMMARY CARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border/60 shadow-sm flex items-center p-4 gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{(docsList || []).length}</p>
            <p className="text-xs text-muted-foreground font-medium">Total Registered Documents</p>
          </div>
        </Card>

        <Card className="bg-card border-border/60 shadow-sm flex items-center p-4 gap-4">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${expiredDocsCount > 0 ? "bg-rose-500/10 text-rose-500" : "bg-muted text-muted-foreground"}`}>
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rose-500">{expiredDocsCount}</p>
            <p className="text-xs text-muted-foreground font-medium">Expired Certificates</p>
          </div>
        </Card>

        <Card className="bg-card border-border/60 shadow-sm flex items-center p-4 gap-4">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${expiringSoonCount > 0 ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground"}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-500">{expiringSoonCount}</p>
            <p className="text-xs text-muted-foreground font-medium">Expiring within 30 Days</p>
          </div>
        </Card>
      </div>

      {/* FILTER PANEL */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-sm p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search documents name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background border border-border/80 rounded-lg px-3 py-1.5 text-xs w-60 focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium"
              />
            </div>

            {/* Entity Type Filter */}
            <select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="bg-background border border-border/80 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All Entities</option>
              <option value="Vehicle">Vehicles</option>
              <option value="Driver">Drivers</option>
            </select>

            {/* Category Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-background border border-border/80 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All Categories</option>
              <option value="Registration Certificate">Registration Certificate</option>
              <option value="Insurance">Insurance</option>
              <option value="Fitness Certificate">Fitness Certificate</option>
              <option value="Pollution Certificate">Pollution Certificate</option>
              <option value="Driver License">Driver License</option>
            </select>
          </div>

          <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-xs">
            Sync Registry
          </Button>
        </div>
      </Card>

      {/* DOCUMENTS GRID */}
      {isDocsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((s) => (
            <Card key={s} className="border-border/60 animate-pulse h-40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-card border border-border/60 rounded-2xl text-muted-foreground">
              <FileCheck className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <h4 className="font-bold text-foreground/80">No Documents Uploaded</h4>
              <p className="text-xs">Attach registration forms or verification slips to manage compliance tracks.</p>
            </div>
          ) : (
            filteredDocs.map((doc: any) => {
              const status = getExpiryStatus(doc.expiryDate)
              return (
                <Card key={doc._id} className="border-border/60 bg-card hover:shadow-md transition-all flex flex-col justify-between">
                  <CardContent className="p-5 space-y-4">
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg flex-shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-bold text-sm text-foreground/90 truncate max-w-[150px]" title={doc.name}>
                            {doc.name}
                          </h4>
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase">{doc.type}</span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Meta Fields */}
                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-border/30 pt-3">
                      <div>
                        <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">Associated Entity</span>
                        <span className="font-semibold text-foreground/85 flex items-center gap-1 mt-0.5">
                          {doc.entityType === "Vehicle" ? (
                            <>
                              <Building className="h-3 w-3 text-blue-500" /> Vehicle
                            </>
                          ) : (
                            <>
                              <User className="h-3 w-3 text-amber-500" /> Driver
                            </>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">Size</span>
                        <span className="font-medium text-foreground/85 mt-0.5 block">{formatFileSize(doc.fileSize)}</span>
                      </div>
                    </div>
                  </CardContent>

                  {/* Actions line */}
                  <div className="p-4 bg-muted/15 border-t border-border/40 flex items-center justify-between gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewDoc(doc)}
                      className="h-8 text-primary font-bold text-xs flex items-center gap-1 hover:bg-primary/10"
                    >
                      <Eye className="h-4 w-4" /> Preview
                    </Button>
                    <div className="flex gap-2">
                      <a
                        href={doc.fileUrl}
                        download={doc.fileName}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Download Certificate"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      {(user?.role === "Fleet Manager" || user?.role === "Safety Officer") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to remove this document?")) {
                              deleteMutation.mutate(doc._id!)
                            }
                          }}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          title="Delete Certificate"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* --- ADD UPLOAD DOCUMENT MODAL --- */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in scale-in duration-200">
            
            {/* Header */}
            <div className="p-5 border-b border-border/40 flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">Upload Entity Document</h3>
              <button
                onClick={() => {
                  setIsAddOpen(false)
                  resetForm()
                }}
                className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Document Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Document Name / Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata Prima Registration 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background border border-border/80 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium"
                />
              </div>

              {/* Doc Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="bg-background border border-border/80 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="Registration Certificate">Registration Certificate</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Fitness Certificate">Fitness Certificate</option>
                  <option value="Pollution Certificate">Pollution Certificate</option>
                  <option value="Driver License">Driver License</option>
                </select>
              </div>

              {/* Target Entity Type */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="radio"
                    checked={targetEntityType === "Vehicle"}
                    onChange={() => {
                      setTargetEntityType("Vehicle")
                      setTargetEntityId("")
                    }}
                    className="text-primary focus:ring-primary"
                  />
                  <span>Vehicle Certificate</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="radio"
                    checked={targetEntityType === "Driver"}
                    onChange={() => {
                      setTargetEntityType("Driver")
                      setTargetEntityId("")
                    }}
                    className="text-primary focus:ring-primary"
                  />
                  <span>Driver Document</span>
                </label>
              </div>

              {/* Target Entity Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">
                  Select Associated {targetEntityType}
                </label>
                <select
                  required
                  value={targetEntityId}
                  onChange={(e) => setTargetEntityId(e.target.value)}
                  className="bg-background border border-border/80 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">-- Choose {targetEntityType} --</option>
                  {targetEntityType === "Vehicle"
                    ? (vehiclesData || []).map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.registrationNumber} - {v.vehicleName}
                        </option>
                      ))
                    : (driversData || []).map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.employeeId} - {d.fullName}
                        </option>
                      ))}
                </select>
              </div>

              {/* Expiry Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="bg-background border border-border/80 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 h-9"
                />
              </div>

              {/* File Attachment Dropzone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground font-sans">Document File Payload</label>
                <div className="border-2 border-dashed border-border/80 rounded-xl p-6 text-center hover:border-primary/50 transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
                  <p className="text-xs font-bold text-foreground/80">Click to upload file attachment</p>
                  <p className="text-[10px] text-muted-foreground mt-1">PDF or image formats accepted (Max size 4MB)</p>
                </div>

                {uploadedFile && (
                  <div className="bg-secondary/40 border border-border/60 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="text-left">
                        <p className="text-xs font-bold truncate max-w-[200px]">{uploadedFile.fileName}</p>
                        <p className="text-[10px] text-muted-foreground">{formatFileSize(uploadedFile.fileSize)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="p-1 rounded-full border border-border hover:bg-muted text-muted-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-border/40 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddOpen(false)
                    resetForm()
                  }}
                  className="font-semibold h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={uploadMutation.isPending}
                  className="font-semibold h-9"
                >
                  {uploadMutation.isPending ? "Uploading payload..." : "Submit Registry"}
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* --- PREVIEW MODAL --- */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-2xl h-[70vh] flex flex-col animate-in scale-in duration-200">
            
            {/* Header */}
            <div className="p-4 border-b border-border/40 flex items-center justify-between bg-muted/20">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" /> Preview: {previewDoc.name}
              </h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Preview Frame */}
            <div className="flex-1 bg-secondary/30 p-6 overflow-y-auto flex items-center justify-center">
              {previewDoc.fileUrl.startsWith("data:image/") ? (
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-sm border border-border"
                />
              ) : (
                <div className="text-center space-y-3">
                  <FileText className="h-16 w-16 mx-auto text-primary" />
                  <div>
                    <h4 className="font-bold text-sm">{previewDoc.fileName}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      File type is PDF or binary payload. Select Download option to read document details.
                    </p>
                  </div>
                  <a
                    href={previewDoc.fileUrl}
                    download={previewDoc.fileName}
                    className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:shadow hover:opacity-90"
                  >
                    <Download className="h-4 w-4 mr-1.5" /> Download File Payload
                  </a>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}


