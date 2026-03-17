import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DocumentUpload } from "@/components/DocumentUpload";
import { Shield, ArrowLeft, ArrowRight, Check, User, Users, FileUp, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, title: "Dados Pessoais", icon: User },
  { id: 2, title: "Custodiado", icon: Users },
  { id: 3, title: "Documentos", icon: FileUp },
  { id: 4, title: "Dependentes", icon: UserPlus },
];

const relationshipOptions = [
  "Cônjuge",
  "Companheiro(a)",
  "Pai/Mãe",
  "Filho(a)",
  "Irmão(ã)",
  "Avô/Avó",
  "Tio(a)",
  "Primo(a)",
  "Amigo(a)",
  "Outro",
];

interface UploadedFile {
  file: File;
  preview?: string;
}

interface Dependent {
  fullName: string;
  birthDate: string;
  document: string;
  birthCertificate: UploadedFile[];
}

export default function NewRequest() {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Step 1 - Personal
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");

  // Step 2 - Inmate
  const [inmateName, setInmateName] = useState("");
  const [inmateMotherName, setInmateMotherName] = useState("");
  const [relationship, setRelationship] = useState("");

  // Step 3 - Documents
  const [rgFiles, setRgFiles] = useState<UploadedFile[]>([]);
  const [cpfFiles, setCpfFiles] = useState<UploadedFile[]>([]);
  const [addressProofFiles, setAddressProofFiles] = useState<UploadedFile[]>([]);
  const [criminalRecordFiles, setCriminalRecordFiles] = useState<UploadedFile[]>([]);
  const [photoFiles, setPhotoFiles] = useState<UploadedFile[]>([]);
  const [marriageCertFiles, setMarriageCertFiles] = useState<UploadedFile[]>([]);

  // Step 4 - Dependents
  const [hasDependents, setHasDependents] = useState(false);
  const [dependents, setDependents] = useState<Dependent[]>([]);

  const isSpouse = relationship === "Cônjuge" || relationship === "Companheiro(a)";

  const addDependent = () => {
    setDependents([...dependents, { fullName: "", birthDate: "", document: "", birthCertificate: [] }]);
  };

  const updateDependent = (index: number, field: keyof Dependent, value: any) => {
    const updated = [...dependents];
    updated[index] = { ...updated[index], [field]: value };
    setDependents(updated);
  };

  const removeDependent = (index: number) => {
    setDependents(dependents.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return fullName && birthDate && street && city && state && zipCode;
      case 2:
        return inmateName && inmateMotherName && relationship;
      case 3: {
        const baseValid = rgFiles.length > 0 && cpfFiles.length > 0 && addressProofFiles.length > 0 && criminalRecordFiles.length > 0 && photoFiles.length > 0;
        if (isSpouse) return baseValid && marriageCertFiles.length > 0;
        return baseValid;
      }
      case 4:
        if (!hasDependents) return true;
        return dependents.length > 0 && dependents.every(d => d.fullName && d.birthDate && d.document && d.birthCertificate.length > 0);
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    toast({
      title: "Requerimento enviado!",
      description: "Protocolo: PROT-2024-00143. Você receberá atualizações por e-mail.",
    });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-6 gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Novo Requerimento</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[640px] px-6 py-12">
        {/* Step indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                      currentStep > step.id
                        ? "border-success bg-success"
                        : currentStep === step.id
                        ? "border-primary bg-primary"
                        : "border-border bg-card"
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5 text-success-foreground" />
                    ) : (
                      <step.icon
                        className={cn(
                          "h-5 w-5",
                          currentStep === step.id ? "text-primary-foreground" : "text-muted-foreground"
                        )}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium",
                      currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      "mx-4 h-0.5 w-12 md:w-20 -mt-6",
                      currentStep > step.id ? "bg-success" : "bg-border"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Dados Pessoais</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Informe seus dados pessoais para o requerimento.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome completo *</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome completo" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Data de nascimento *</Label>
                    <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="street">Endereço *</Label>
                    <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Rua, número, complemento" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade *</Label>
                      <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">Estado *</Label>
                      <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="UF" maxLength={2} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP *</Label>
                    <Input id="zipCode" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="00000-000" required />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Dados do Custodiado</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Informe os dados do custodiado que deseja visitar.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inmateName">Nome completo do custodiado *</Label>
                    <Input id="inmateName" value={inmateName} onChange={(e) => setInmateName(e.target.value)} placeholder="Nome do custodiado" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inmateMotherName">Nome da mãe do custodiado *</Label>
                    <Input id="inmateMotherName" value={inmateMotherName} onChange={(e) => setInmateMotherName(e.target.value)} placeholder="Nome da mãe" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Relacionamento com o custodiado *</Label>
                    <Select value={relationship} onValueChange={setRelationship}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o relacionamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {relationshipOptions.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {isSpouse && (
                    <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                      <p className="text-sm text-warning font-medium">
                        Como cônjuge/companheiro(a), será necessário anexar a Escritura de união estável e/ou certidão de casamento na etapa de documentos.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Documentos</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Anexe os documentos obrigatórios para análise.</p>
                </div>
                <div className="space-y-6">
                  <DocumentUpload label="Cópia do RG" required files={rgFiles} onFilesChange={setRgFiles} accept="image/*,.pdf" />
                  <DocumentUpload label="Cópia do CPF" required files={cpfFiles} onFilesChange={setCpfFiles} accept="image/*,.pdf" />
                  <DocumentUpload label="Comprovante de Endereço" required files={addressProofFiles} onFilesChange={setAddressProofFiles} accept="image/*,.pdf" />
                  <DocumentUpload label="Certidão Negativa Criminal" required files={criminalRecordFiles} onFilesChange={setCriminalRecordFiles} accept="image/*,.pdf" />
                  <DocumentUpload label="Foto 3x4 (atualizada)" required files={photoFiles} onFilesChange={setPhotoFiles} accept="image/*" description="Foto recente com fundo claro." />
                  {isSpouse && (
                    <DocumentUpload
                      label="Escritura de União Estável / Certidão de Casamento"
                      required
                      files={marriageCertFiles}
                      onFilesChange={setMarriageCertFiles}
                      accept="image/*,.pdf"
                    />
                  )}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Dependentes</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Informe se há dependentes que também farão visitação.</p>
                </div>

                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <Switch checked={hasDependents} onCheckedChange={setHasDependents} />
                  <Label>Há dependentes para visitação?</Label>
                </div>

                {hasDependents && (
                  <div className="space-y-6">
                    {dependents.map((dep, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border p-6 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold">Dependente {i + 1}</h3>
                          <Button variant="ghost" size="sm" onClick={() => removeDependent(i)} className="text-destructive">
                            Remover
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label>Nome completo *</Label>
                          <Input value={dep.fullName} onChange={(e) => updateDependent(i, "fullName", e.target.value)} placeholder="Nome do dependente" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Data de nascimento *</Label>
                            <Input type="date" value={dep.birthDate} onChange={(e) => updateDependent(i, "birthDate", e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Documento *</Label>
                            <Input value={dep.document} onChange={(e) => updateDependent(i, "document", e.target.value)} placeholder="RG ou CPF" />
                          </div>
                        </div>
                        <DocumentUpload
                          label="Certidão de Nascimento"
                          required
                          files={dep.birthCertificate}
                          onFilesChange={(files) => updateDependent(i, "birthCertificate", files)}
                          accept="image/*,.pdf"
                        />
                      </motion.div>
                    ))}
                    <Button variant="outline" onClick={addDependent} className="w-full">
                      <Plus className="h-4 w-4" />
                      Adicionar Dependente
                    </Button>
                  </div>
                )}

                {/* Review Summary */}
                <div className="rounded-xl border bg-card p-6 space-y-4 mt-8">
                  <h3 className="text-sm font-semibold">Resumo do Requerimento</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="label-institutional">Solicitante</span>
                      <p className="mt-1 font-medium">{fullName || "—"}</p>
                    </div>
                    <div>
                      <span className="label-institutional">Custodiado</span>
                      <p className="mt-1 font-medium">{inmateName || "—"}</p>
                    </div>
                    <div>
                      <span className="label-institutional">Relacionamento</span>
                      <p className="mt-1 font-medium">{relationship || "—"}</p>
                    </div>
                    <div>
                      <span className="label-institutional">Documentos</span>
                      <p className="mt-1 font-medium">
                        {[rgFiles, cpfFiles, addressProofFiles, criminalRecordFiles, photoFiles, marriageCertFiles].filter(f => f.length > 0).length} de {isSpouse ? 6 : 5} anexados
                      </p>
                    </div>
                    {hasDependents && (
                      <div>
                        <span className="label-institutional">Dependentes</span>
                        <p className="mt-1 font-medium">{dependents.length}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </Button>

          {currentStep < 4 ? (
            <Button onClick={() => setCurrentStep((s) => s + 1)} disabled={!canProceed()}>
              Próximo
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed()}>
              Enviar para Análise
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

function Plus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" /><path d="M12 5v14" />
    </svg>
  );
}
