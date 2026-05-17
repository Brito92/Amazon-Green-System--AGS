import { useEffect, useState } from "react";
import {
  subscribeToBlockchainAudits,
  getBlockchainAuditRecords,
  shortHash,
  type BlockchainAuditRecord,
} from "@/lib/blockchain";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ptDateTime } from "@/lib/format";
import { AlertCircle, CheckCircle2, Clock, Zap } from "lucide-react";

export function BlockchainAuditLog() {
  const [records, setRecords] = useState<BlockchainAuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newEventsCount, setNewEventsCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // Initial load
    (async () => {
      try {
        const data = await getBlockchainAuditRecords(30);
        if (!cancelled) {
          setRecords(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao carregar registros");
          setLoading(false);
        }
      }
    })();

    // Subscribe to new events
    const unsubscribe = subscribeToBlockchainAudits(
      (newRecord) => {
        if (!cancelled) {
          setRecords((prev) => [newRecord, ...prev].slice(0, 30));
          setNewEventsCount((prev) => prev + 1);
        }
      },
      (err) => {
        if (!cancelled) setError(err.message);
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "muda_validada":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "consorcio_validado":
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      case "credito_emitido":
        return <Zap className="h-4 w-4 text-amber-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case "muda_validada":
        return "Muda Validada";
      case "consorcio_validado":
        return "Consórcio Validado";
      case "credito_emitido":
        return "Crédito Emitido";
      default:
        return eventType;
    }
  };

  const getStatusBadge = (record: BlockchainAuditRecord) => {
    if (record.error_message) {
      return <Badge variant="destructive">Erro</Badge>;
    }
    if (record.is_audited && record.audit_status === "valido") {
      return <Badge className="bg-green-600">Auditado</Badge>;
    }
    if (record.block_hash || record.mined_at) {
      return <Badge className="bg-blue-600">Minerado</Badge>;
    }
    return <Badge variant="outline">Pendente</Badge>;
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar auditoria</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-600" />
            Log de Auditoria Blockchain
          </CardTitle>
          {newEventsCount > 0 && (
            <Badge className="bg-blue-600">
              +{newEventsCount} novo{newEventsCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum registro de blockchain ainda
            </div>
          ) : (
            records.map((record) => (
              <div
                key={record.id}
                className="flex items-start justify-between p-3 rounded border border-border/50 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-0.5">{getEventIcon(record.event_type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {getEventLabel(record.event_type)} ({record.target_type})
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      ID: {record.target_id.slice(0, 8)}...
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {ptDateTime(record.created_at)}
                    </div>
                    {record.external_hash && (
                      <div className="text-xs text-muted-foreground mt-1 font-mono">
                        Hash: {shortHash(record.external_hash, 16)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="ml-3">{getStatusBadge(record)}</div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
